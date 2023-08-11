import { task } from "hardhat/config";

import protocolConfig from "../protocol.config";

// npx hardhat deploy-price-oracle --network optimism

task("update-price-oracle", "Updates the price oracle of the comptroller")
    .addParam("priceOracleKey", "The key of the price oracle to use")
    .setAction(async (args, hre, runSuper) => {
        const {
            network,
            ethers,
            getNamedAccounts,
            deployments: { deploy, get, all },
        } = hre;

        console.log("running task: update-price-oracle");

        const ComptrollerProxy = await ethers.getContract("Unitroller");
        const Comptroller = await ethers.getContractAt(
            "Comptroller",
            ComptrollerProxy.address,
        );

        const priceOracleDeploy = await get(args.priceOracleKey);

        const tx = await Comptroller._setPriceOracle(priceOracleDeploy.address);
        await tx.wait();
    });
