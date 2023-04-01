import { deployments, ethers } from "hardhat";

const setupFixture = deployments.createFixture(
    async ({ deployments, companionNetworks }, options) => {
        await deployments.fixture(undefined, {
            keepExistingDeployments: true,
        });

        const companionDeployments = companionNetworks["mainnet"].deployments;
        const [deployer] = await ethers.getSigners();

        const comptrollerDeploy = await deployments.deploy("Comptroller", {
            from: deployer.address,
            log: true,
            contract: "contracts/Comptroller.sol:Comptroller",
        });

        const unitrollerDeploy = await companionDeployments.get(
            "ComptrollerV1",
        );
        const unitroller = await ethers.getContractAt(
            "Unitroller",
            unitrollerDeploy.address,
        );
        // set storage to new comptroller deploy
        await ethers.provider.send("hardhat_setStorageAt", [
            unitrollerDeploy.address,
            "0x2",
            ethers.utils.hexZeroPad(comptrollerDeploy.address, 32),
        ]);

        const comptroller = await ethers.getContractAt(
            "Comptroller",
            unitrollerDeploy.address,
        );

        const rewardDistributorDeploy = await deployments.deploy(
            "RewardDistributor",
            {
                from: deployer.address,
                args: [comptroller.address],
                log: true,
                contract:
                    "contracts/ExternalRewardDistributor.sol:ExternalRewardDistributorV1",
            },
        );
        const rewardDistributor = await ethers.getContractAt(
            "ExternalRewardDistributorV1",
            rewardDistributorDeploy.address,
        );

        // read markets from comptroller and create contracts
        const markets = await comptroller.getAllMarkets();
        const cTokens = {};
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i];
            const cToken = await ethers.getContractAt("CToken", market);
            const symbol = await cToken.symbol();
            cTokens[symbol] = cToken;
        }

        return {
            comptroller,
            rewardDistributor,
            cTokens,
        };
    },
);

export { setupFixture };
