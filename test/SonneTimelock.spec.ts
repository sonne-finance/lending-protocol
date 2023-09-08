import { expect } from "chai";
import { BaseContract, Contract } from "ethers";
import { ethers } from "hardhat";
import { IMarket, deployedFixture } from "./_fixtures";

describe("SonneTimelock", () => {
    let unitroller: Contract,
        comptroller: Contract,
        rewardDistributor: Contract,
        markets: { [key: string]: IMarket },
        timelock: BaseContract;

    beforeEach(async () => {
        const deployed = await deployedFixture();
        unitroller = deployed.unitroller;
        comptroller = deployed.comptroller;
        rewardDistributor = deployed.rewardDistributor;
        markets = deployed.markets;
        timelock = deployed.timelock;
    });

    it("should reduce reserves from timelock", async () => {
        const [deployer, user1, user2] = await ethers.getSigners();

        const RESERVES_ROLE = await timelock.RESERVES_ROLE();

        const market = Object.values(markets)[0];
        const marketAddress = await market.cToken.getAddress();

        const amount =
            market.cash > market.totalReserves
                ? market.totalReserves
                : market.cash;

        await expect(
            timelock._reduceReserves(marketAddress, amount, user1.address),
        ).to.not.reverted;

        expect(await market.underlying.balanceOf(user1.address)).to.eq(amount);

        const biggerAmount = amount + 1n;
        await expect(
            timelock._reduceReserves(
                marketAddress,
                biggerAmount,
                user1.address,
            ),
        ).revertedWithCustomError(
            market.cToken,
            biggerAmount > market.totalReserves
                ? "ReduceReservesCashValidation"
                : "ReduceReservesCashNotAvailable",
        );

        await expect(
            timelock
                .connect(user1)
                ._reduceReserves(marketAddress, amount, user1.address),
        ).revertedWith(
            `AccessControl: account ${user1.address.toLowerCase()} is missing role ${RESERVES_ROLE.toLowerCase()}`,
        );
    });
});
