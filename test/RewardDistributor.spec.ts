import { BigNumber, Contract } from "ethers";
import { ethers } from "hardhat";
import { expect } from "chai";
import { setupFixture } from "./_fixtures";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const sonneAddress = "0x1db2466d9f5e10d7090e7152b68d62703a2245f0";
const opAddress = "0x4200000000000000000000000000000000000042";

const lenderAddress = "0x418c0fc22d28f232fddaee148b38e5df38674abf";
const opWhaleAddress = "0xa28390A0eb676c1C40dAa794ECc2336740701BD1";

describe("RewardDistributor", () => {
    let comptroller: Contract;
    let cTokens: { [key: string]: Contract };
    let rewardDistributor: Contract;

    let sonneToken: Contract;
    let opToken: Contract;

    let lender: SignerWithAddress;
    let opWhale: SignerWithAddress;

    let rewardStart: BigNumber;

    beforeEach(async () => {
        const setup = await setupFixture();
        comptroller = setup.comptroller;
        rewardDistributor = setup.rewardDistributor;
        cTokens = setup.cTokens;

        const currentBlock = await comptroller.getBlockNumber();
        rewardStart = currentBlock.add(1000);

        await rewardDistributor._initializeReward(
            opAddress,
            rewardStart,
            [
                "0x5569b83de187375d43FBd747598bfe64fC8f6436",
                "0x5Ff29E4470799b982408130EFAaBdeeAE7f66a10",
                "0x8cD6b19A07d754bF36AdEEE79EDF4F2134a8F571",
                "0xEC8FEa79026FfEd168cCf5C627c7f486D77b765F",
                "0xf7B5965f5C117Eb1B5450187c9DcFccc3C317e8E",
                "0xd14451E0Fa44B18f08aeB1E4a4d092B823CaCa68",
                "0xD7dAabd899D1fAbbC3A9ac162568939CEc0393Cc",
                "0x33865E09A572d4F1CC4d75Afc9ABcc5D3d4d867D",
                "0xAFdf91f120DEC93c65fd63DBD5ec372e5dcA5f82",
                "0x26AaB17f27CD1c8d06a0Ad8E4a1Af8B1032171d5",
            ],
            [
                "15860055827886700",
                "15860055827886700",
                "12976409313725500",
                "15860055827886700",
                "8650939542483660",
                "2883646514161220",
                "2883646514161220",
                "8650939542483660",
                "5767293028322440",
                "8650939542483660",
            ],
            [
                "111026007625272000",
                "111026007625272000",
                "90839460784313700",
                "111026007625272000",
                "60559640522875800",
                "20186546840958600",
                "20186546840958600",
                "60559640522875800",
                "40373093681917200",
                "60559640522875800",
            ],
        );

        // impersonate users
        await ethers.provider.send("hardhat_impersonateAccount", [
            lenderAddress,
        ]);
        lender = await ethers.getSigner(lenderAddress);
        await ethers.provider.send("hardhat_impersonateAccount", [
            opWhaleAddress,
        ]);
        opWhale = await ethers.getSigner(opWhaleAddress);

        // tokens
        sonneToken = await ethers.getContractAt("EIP20Interface", sonneAddress);
        opToken = await ethers.getContractAt("EIP20Interface", opAddress);

        await opToken
            .connect(opWhale)
            .transfer(
                rewardDistributor.address,
                ethers.utils.parseEther("100000"),
            );
    });

    it("Should be deployed", async () => {
        expect(rewardDistributor.address).to.be.properAddress;
    });

    it("Should have a comptroller", async () => {
        const comptrollerSetted = await rewardDistributor.comptroller();
        expect(comptrollerSetted).to.be.properAddress;
        expect(comptrollerSetted).to.be.equal(comptroller.address);
    });

    it("Should claim external rewards", async () => {
        await ethers.provider.send("hardhat_impersonateAccount", [
            lenderAddress,
        ]);
        const user = await ethers.getSigner(lenderAddress);

        const positions = await getWalletPositions(comptroller, lenderAddress);
        const marketStates = await Promise.all(
            positions.map(position =>
                rewardDistributor.rewardMarketState(
                    opAddress,
                    position.cToken.address,
                ),
            ),
        );
        const supplySpeeds = marketStates.map(state => state.supplySpeed);
        const borrowSpeeds = marketStates.map(state => state.borrowSpeed);
        const marketRewardPerSecond = positions.map((position, i) => {
            const supplyReward = position.supplyBalance
                .mul(supplySpeeds[i])
                .div(ethers.utils.parseEther("1"));
            const borrowReward = position.borrowBalance
                .mul(borrowSpeeds[i])
                .div(ethers.utils.parseEther("1"));
            return supplyReward.add(borrowReward);
        });
        const rewardPerSecond = marketRewardPerSecond.reduce(
            (acc, reward) => acc.add(reward),
            BigNumber.from(0),
        );

        // reset sonne reward by claiming
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            rewardStart.toNumber(),
        ]);
        await comptroller
            .connect(user)
            .functions["claimComp(address,address[])"](
                lenderAddress,
                positions.map(position => position.cToken.address),
            );
        //

        const diffSeconds = 24 * 60 * 60; // 1 day
        // set block time to reward start
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            rewardStart.toNumber() + diffSeconds / 2,
        ]);

        await rewardDistributor._updateRewardSpeeds(
            opAddress,
            ["0xEC8FEa79026FfEd168cCf5C627c7f486D77b765F"],
            [0],
            ["222052015250544000"],
        );

        // set block time to reward start
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            rewardStart.toNumber() + diffSeconds,
        ]);

        const expectedReward = rewardPerSecond.mul(diffSeconds);
        console.log(
            "Expected reward",
            ethers.utils.formatEther(expectedReward),
        );

        const diffBalances = await watchBalances(
            async () => {
                await comptroller
                    .connect(user)
                    .functions["claimComp(address,address[])"](
                        lenderAddress,
                        ["0xEC8FEa79026FfEd168cCf5C627c7f486D77b765F"],
                        //positions.map(position => position.cToken.address),
                    );
            },
            [sonneAddress, opAddress],
            lenderAddress,
        );

        console.log(
            diffBalances.map(balance => ethers.utils.formatEther(balance)),
        );
    });
});

const getWalletPositions = async (
    comptroller: Contract,
    userAddress: string,
) => {
    const markets = await comptroller.getAssetsIn(userAddress);
    const cTokens = await Promise.all(
        markets.map(market => ethers.getContractAt("CToken", market)),
    );
    const balances = await Promise.all(
        cTokens.map(cToken => cToken.balanceOf(userAddress)),
    );
    const borrowBalances = await Promise.all(
        cTokens.map(cToken => cToken.borrowBalanceStored(userAddress)),
    );
    const borrowIndexs = await Promise.all(
        cTokens.map(cToken => cToken.borrowIndex()),
    );

    return markets.map((market, i) => ({
        market,
        cToken: cTokens[i],
        supplyBalance: balances[i],
        borrowBalance: borrowBalances[i]
            .mul(borrowIndexs[i])
            .div(ethers.utils.parseEther("1")),
    }));
};

const watchBalances = async (
    fn: Function,
    tokens: string[],
    userAddress: string,
) => {
    const tokenContracts = await Promise.all(
        tokens.map(token => ethers.getContractAt("EIP20Interface", token)),
    );
    const getBalances = async () =>
        await Promise.all(
            tokenContracts.map(contract => contract.balanceOf(userAddress)),
        );

    const beforeBalances = await getBalances();
    await fn();
    const afterBalances = await getBalances();

    return afterBalances.map((balance, i) => balance.sub(beforeBalances[i]));
};
