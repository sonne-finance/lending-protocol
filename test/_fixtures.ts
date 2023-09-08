import { deployments, ethers } from "hardhat";
import { getImpersonatedSigner } from "./_utils";
import { BaseContract, Contract } from "ethers";

export interface IMarket {
    cToken: Contract;
    underlying: Contract;
    cash: bigint;
    totalReserves: bigint;
}
export interface IDeployedFixtureOutput {
    unitroller: Contract;
    comptroller: Contract;
    rewardDistributor: Contract;
    markets: { [key: string]: IMarket };
    timelock: BaseContract;
}

const deployedFixture = deployments.createFixture<IDeployedFixtureOutput, any>(
    async ({ deployments, network, companionNetworks }, options) => {
        await deployments.fixture(undefined, {
            keepExistingDeployments: true,
        });

        const companionDeployments = companionNetworks["mainnet"].deployments;
        const [deployer, user1, user2] = await ethers.getSigners();

        const timelock = await ethers.getContract("SonneTimelockController");
        const timelockAddress = await timelock.getAddress();
        const timelockSigner = await getImpersonatedSigner(timelockAddress);

        /* Unitroller */
        const unitrollerDeploy = await companionDeployments.get("Unitroller");
        const unitrollerAddress = unitrollerDeploy.address;
        const unitroller = await ethers.getContractAt(
            "Unitroller",
            unitrollerAddress,
        );
        // set timelock as admin
        const unitrollerAdminAddress = await unitroller.admin();
        const unitrollerAdminSigner = await getImpersonatedSigner(
            unitrollerAdminAddress,
        );
        await unitroller
            .connect(unitrollerAdminSigner)
            ._setPendingAdmin(timelockAddress);
        await unitroller.connect(timelockSigner)._acceptAdmin();

        const comptroller = await ethers.getContractAt(
            "Comptroller",
            unitrollerAddress,
        );

        const rewardDistributorDeploy = await companionDeployments.get(
            "ExternalRewardDistributor",
        );
        const rewardDistributorAddress = rewardDistributorDeploy.address;
        const rewardDistributor = await ethers.getContractAt(
            "ExternalRewardDistributor",
            rewardDistributorAddress,
        );

        /* Markets */
        const marketAddresses = await comptroller.getAllMarkets();
        const markets: {
            [key: string]: IMarket;
        } = {};
        for (let i = 0; i < marketAddresses.length; i++) {
            const marketAddress = marketAddresses[i];
            const cToken = await ethers.getContractAt("CErc20", marketAddress);

            const symbol = await cToken.symbol();
            const underlyingAddress = await cToken.underlying();
            const underlying = await ethers.getContractAt(
                "IERC20",
                underlyingAddress,
            );
            markets[symbol] = {
                cToken,
                underlying,
                cash: await cToken.getCash(),
                totalReserves: await cToken.totalReserves(),
            };
        }

        // set timelock as admin
        await Promise.all(
            Object.values(markets).map(async (market) => {
                const cToken = market.cToken;
                const cTokenAdminAddress = await cToken.admin();
                const cTokenAdminSigner = await getImpersonatedSigner(
                    cTokenAdminAddress,
                );
                await cToken
                    .connect(cTokenAdminSigner)
                    ._setPendingAdmin(timelockAddress);
                await cToken.connect(timelockSigner)._acceptAdmin();
            }),
        );

        return {
            unitroller,
            comptroller,
            rewardDistributor,
            markets,
            timelock,
        };
    },
);

export { deployedFixture };
