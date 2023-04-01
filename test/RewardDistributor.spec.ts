import { BigNumber, Contract } from 'ethers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { setupFixture } from './_fixtures';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

const sonneAddress = '0x1db2466d9f5e10d7090e7152b68d62703a2245f0';
const opAddress = '0x4200000000000000000000000000000000000042';

const lenderAddress = '0x418c0fc22d28f232fddaee148b38e5df38674abf';
const opWhaleAddress = '0xa28390A0eb676c1C40dAa794ECc2336740701BD1';

describe('RewardDistributor', () => {
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
            Object.values(cTokens).map(x => x.address),
            Object.keys(cTokens).map(x => ethers.utils.parseEther('1')),
            Object.keys(cTokens).map(x => 0),
        );

        // impersonate users
        await ethers.provider.send('hardhat_impersonateAccount', [
            lenderAddress,
        ]);
        lender = await ethers.getSigner(lenderAddress);
        await ethers.provider.send('hardhat_impersonateAccount', [
            opWhaleAddress,
        ]);
        opWhale = await ethers.getSigner(opWhaleAddress);

        // tokens
        sonneToken = await ethers.getContractAt('EIP20Interface', sonneAddress);
        opToken = await ethers.getContractAt('EIP20Interface', opAddress);

        await opToken
            .connect(opWhale)
            .transfer(
                rewardDistributor.address,
                ethers.utils.parseEther('100'),
            );
    });

    it('Should be deployed', async () => {
        expect(rewardDistributor.address).to.be.properAddress;
    });

    it('Should have a comptroller', async () => {
        const comptrollerSetted = await rewardDistributor.comptroller();
        expect(comptrollerSetted).to.be.properAddress;
        expect(comptrollerSetted).to.be.equal(comptroller.address);
    });

    it('Should claim external rewards', async () => {
        await ethers.provider.send('hardhat_impersonateAccount', [
            lenderAddress,
        ]);
        const user = await ethers.getSigner(lenderAddress);

        // set block time to reward start
        await ethers.provider.send('evm_setNextBlockTimestamp', [
            rewardStart.toNumber() + 1,
        ]);

        const diffBalances = await watchBalances(
            async () => {
                await comptroller
                    .connect(user)
                    .functions['claimComp(address)'](lenderAddress);
            },
            [sonneAddress, opAddress],
            lenderAddress,
        );

        console.log(
            diffBalances.map(balance => ethers.utils.formatEther(balance)),
        );
    });
});

const watchBalances = async (
    fn: Function,
    tokens: string[],
    userAddress: string,
) => {
    const tokenContracts = await Promise.all(
        tokens.map(token => ethers.getContractAt('EIP20Interface', token)),
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
