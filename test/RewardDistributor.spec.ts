import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { Contract } from "ethers";
import { ethers } from "hardhat";
import { setupFixture } from "./_fixtures";

const sonneAddress = "0x1db2466d9f5e10d7090e7152b68d62703a2245f0";
const opAddress = "0x4200000000000000000000000000000000000042";

const lenderAddress = "0x418c0fc22d28f232fddaee148b38e5df38674abf";
const opWhaleAddress = "0xa28390A0eb676c1C40dAa794ECc2336740701BD1";

const MANTISSA = ethers.WeiPerEther;

describe.skip("RewardDistributor", () => {
    let comptroller: Contract;
    let cTokens: { [key: string]: Contract };
    let rewardDistributor: Contract;

    let sonneToken: Contract;
    let opToken: Contract;

    let lender: SignerWithAddress;
    let opWhale: SignerWithAddress;

    let rewardStart: bigint;

    beforeEach(async () => {
        const setup = await setupFixture();
        comptroller = setup.comptroller;
        rewardDistributor = setup.rewardDistributor;
        cTokens = setup.cTokens;

        const currentBlock = await comptroller.getBlockNumber();
        rewardStart = currentBlock;

        await rewardDistributor._whitelistToken(opAddress);

        await rewardDistributor._updateRewardSpeeds(
            opAddress,
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
            .transfer(rewardDistributor.address, ethers.parseEther("100000"));
    });

    it("Should be deployed", async () => {
        expect(rewardDistributor.address).to.be.properAddress;
    });

    describe("Admin", () => {
        it("Should whitelist a token", async () => {
            await expect(rewardDistributor._whitelistToken(sonneAddress)).to.not
                .reverted;
        });

        it("Should revert non admin whitelist", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor.connect(user)._whitelistToken(sonneAddress),
            ).to.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert whitelist zero address", async () => {
            await expect(
                rewardDistributor._whitelistToken(ethers.ZeroAddress),
            ).to.revertedWith(
                "RewardDistributor: reward token cannot be zero address",
            );
        });

        it("Should revert whitelist a token twice", async () => {
            await expect(rewardDistributor._whitelistToken(sonneAddress)).to.not
                .reverted;

            await expect(
                rewardDistributor._whitelistToken(sonneAddress),
            ).to.revertedWith("RewardDistributor: reward token already exists");
        });

        it("Should update reward speeds", async () => {
            const supplyReward1 = "15860055827886700";
            const supplyReward2 = "12976409313725500";
            const borrowReward1 = "111026007625272000";
            const borrowReward2 = "2883646514161220";

            await expect(
                rewardDistributor._updateRewardSpeeds(
                    opAddress,
                    [
                        "0x5569b83de187375d43FBd747598bfe64fC8f6436",
                        "0x5Ff29E4470799b982408130EFAaBdeeAE7f66a10",
                    ],
                    [supplyReward1, supplyReward2],
                    [borrowReward1, borrowReward2],
                ),
            ).to.not.reverted;

            const marketState = await rewardDistributor.rewardMarketState(
                opAddress,
                "0x5569b83de187375d43FBd747598bfe64fC8f6436",
            );
            expect(marketState.supplySpeed).to.be.equal(supplyReward1);
            expect(marketState.borrowSpeed).to.be.equal(borrowReward1);
        });

        it("Should revert non admin update reward speeds", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor
                    .connect(user)
                    ._updateRewardSpeeds(
                        opAddress,
                        [
                            "0x5569b83de187375d43FBd747598bfe64fC8f6436",
                            "0x5Ff29E4470799b982408130EFAaBdeeAE7f66a10",
                        ],
                        ["15860055827886700", "12976409313725500"],
                        ["111026007625272000", "2883646514161220"],
                    ),
            ).to.revertedWith("Ownable: caller is not the owner");
        });

        it("Should revert update reward speeds incorrect input", async () => {
            await expect(
                rewardDistributor._updateRewardSpeeds(
                    opAddress,
                    [
                        "0x5569b83de187375d43FBd747598bfe64fC8f6436",
                        "0x5Ff29E4470799b982408130EFAaBdeeAE7f66a10",
                    ],
                    ["15860055827886700", "12976409313725500"],
                    ["111026007625272000"],
                ),
            ).to.revertedWith(
                "RewardDistributor: borrow speed array length mismatch",
            );

            await expect(
                rewardDistributor._updateRewardSpeeds(
                    opAddress,
                    ["0x5569b83de187375d43FBd747598bfe64fC8f6436"],
                    ["15860055827886700", "12976409313725500"],
                    ["111026007625272000"],
                ),
            ).to.revertedWith(
                "RewardDistributor: supply speed array length mismatch",
            );

            await expect(
                rewardDistributor._updateRewardSpeeds(
                    sonneAddress,
                    [
                        "0x5569b83de187375d43FBd747598bfe64fC8f6436",
                        "0x5Ff29E4470799b982408130EFAaBdeeAE7f66a10",
                    ],
                    ["15860055827886700", "12976409313725500"],
                    ["111026007625272000", "2883646514161220"],
                ),
            ).to.revertedWith("RewardDistributor: reward token does not exist");
        });

        it("Should grant reward to user ", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor
                    .connect(deployer)
                    ._grantReward(opAddress, deployer.address, 1000),
            ).to.not.reverted;

            await expect(
                rewardDistributor
                    .connect(user)
                    ._grantReward(opAddress, user.address, 1000),
            ).to.revertedWith("Ownable: caller is not the owner");

            await expect(
                rewardDistributor
                    .connect(deployer)
                    ._grantReward(lenderAddress, deployer.address, 1000),
            ).to.revertedWith(
                "RewardDistributor: grant reward token does not exist",
            );
        });

        it("Should revert non admin grant reward", async () => {
            const [deployer, user] = await ethers.getSigners();
            await expect(
                rewardDistributor
                    .connect(user)
                    ._grantReward(opAddress, deployer.address, 1000),
            ).to.revertedWith("Ownable: caller is not the owner");
        });
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
        const userMarkets = await comptroller.getAssetsIn(user.address);

        // reset sonne reward by claiming
        await comptroller
            .connect(user)
            .functions["claimComp(address,address[])"](
                lenderAddress,
                userMarkets,
            );
        //

        const networkNow = (await ethers.provider.getBlock("latest"))!
            .timestamp;
        const halfPeriod = 12 * 60 * 60; // 12 hours
        const fullPeriod = 24 * 60 * 60; // 24 hours
        // set block time to reward start
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            networkNow + halfPeriod,
        ]);

        const firstRewards = await calculateRewards(
            networkNow,
            networkNow + halfPeriod,
            comptroller,
            rewardDistributor,
        );

        await rewardDistributor._updateRewardSpeeds(
            opAddress,
            ["0xEC8FEa79026FfEd168cCf5C627c7f486D77b765F"],
            [0],
            ["222052015250544000"],
        );

        // set block time to reward start
        await ethers.provider.send("evm_setNextBlockTimestamp", [
            networkNow + fullPeriod,
        ]);

        const secondRewards = await calculateRewards(
            networkNow + halfPeriod,
            networkNow + fullPeriod,
            comptroller,
            rewardDistributor,
        );

        const diffBalances = await watchBalances(
            async () => {
                await comptroller
                    .connect(user)
                    .getFunction("claimComp(address,address[])")
                    .call(lenderAddress, userMarkets);
            },
            [sonneAddress, opAddress],
            lenderAddress,
        );

        const expectedOpReward = firstRewards.add(secondRewards);
        const diffSonne = diffBalances[0];
        const diffOp = diffBalances[1];

        expect(diffOp).to.closeTo(expectedOpReward, ethers.parseUnits("1", 9));
    });
});

const calculateRewards = async (start, end, comptroller, rewardDistributor) => {
    const positions = await getWalletPositions(comptroller, lenderAddress);
    const marketStates = await Promise.all(
        positions.map((position) =>
            rewardDistributor.rewardMarketState(
                opAddress,
                position.cToken.address,
            ),
        ),
    );
    const supplySpeeds = marketStates.map((state) => state.supplySpeed);
    const supplyBlocks = marketStates.map((state) => state.supplyBlock);
    const borrowSpeeds = marketStates.map((state) => state.borrowSpeed);
    const borrowBlocks = marketStates.map((state) => state.borrowBlock);

    const marketRewards = positions.map((position, i) => {
        const supplyReward = position.supplyRatio
            .mul(supplySpeeds[i])
            .div(MANTISSA)
            .mul(end - start);
        const borrowReward = position.borrowRatio
            .mul(borrowSpeeds[i])
            .div(MANTISSA)
            .mul(end - start);
        return supplyReward.add(borrowReward);
    });

    const totalReward = marketRewards.reduce(
        (acc, reward) => acc.add(reward),
        ethers.BigNumber.from(0),
    );

    return totalReward;
};

const getWalletPositions = async (
    comptroller: Contract,
    userAddress: string,
) => {
    const userMarkets = await comptroller.getAssetsIn(userAddress);
    const cTokens = await Promise.all(
        userMarkets.map((market: string) =>
            ethers.getContractAt("CTokenInterface", market),
        ),
    );
    const balances = await Promise.all(
        cTokens.map((cToken) => cToken.balanceOf(userAddress)),
    );
    let borrowBalances = await Promise.all(
        cTokens.map((cToken) => cToken.borrowBalanceStored(userAddress)),
    );
    const borrowIndexs = await Promise.all(
        cTokens.map((cToken) => cToken.borrowIndex()),
    );
    const totalSupplies = await Promise.all(
        cTokens.map((cToken) => cToken.totalSupply()),
    );
    let totalBorrows = await Promise.all(
        cTokens.map((cToken) => cToken.totalBorrows()),
    );

    borrowBalances = borrowBalances.map((balance, i) =>
        balance.mul(MANTISSA).div(borrowIndexs[i]),
    );
    totalBorrows = totalBorrows.map((balance, i) =>
        balance.mul(MANTISSA).div(borrowIndexs[i]),
    );

    return cTokens.map((cToken, i) => ({
        address: cToken.address,
        cToken: cToken,
        supplyBalance: balances[i],
        borrowBalance: borrowBalances[i],
        supplyRatio: balances[i].mul(MANTISSA).div(totalSupplies[i]),
        borrowRatio: borrowBalances[i].mul(MANTISSA).div(totalBorrows[i]),
        totalSupply: totalSupplies[i],
        totalBorrow: totalBorrows[i],
    }));
};

const watchBalances = async (
    fn: Function,
    tokens: string[],
    userAddress: string,
) => {
    const tokenContracts = await Promise.all(
        tokens.map((token) => ethers.getContractAt("EIP20Interface", token)),
    );
    const getBalances = async () =>
        await Promise.all(
            tokenContracts.map((contract) => contract.balanceOf(userAddress)),
        );

    const beforeBalances = await getBalances();
    await fn();
    const afterBalances = await getBalances();

    return afterBalances.map((balance, i) => balance.sub(beforeBalances[i]));
};
