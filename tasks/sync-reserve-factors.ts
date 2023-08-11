import { task } from "hardhat/config";

import protocolConfig from "../protocol.config";
import { BigNumber } from "ethers";

// npx hardhat sync-reserve-factors --network $NETWORK

task("sync-reserve-factors", "Sync Reserve factors with config").setAction(
    async (args, hre, runSuper) => {
        const {
            network,
            ethers,
            getNamedAccounts,
            deployments: { deploy, getOrNull, all },
        } = hre;

        const marketConfig = protocolConfig[network.name].markets;

        const { deployer } = await getNamedAccounts();

        const ComptrollerProxy = await ethers.getContract("Unitroller");
        const Comptroller = await ethers.getContractAt(
            "Comptroller",
            ComptrollerProxy.address,
        );

        const existingCTokens = await Comptroller.getAllMarkets();

        const txPromises: any[] = [];

        for (const cToken of existingCTokens) {
            const cTokenContract = await ethers.getContractAt("CToken", cToken);
            const symbol = await cTokenContract.symbol();
            const config = marketConfig[symbol];
            if (
                config.reserveFactor == undefined ||
                config.reserveFactor == null
            )
                continue;

            // set reserve factor
            const reserveFactor = await cTokenContract.reserveFactorMantissa();
            const newReserveFactor = ethers.utils.parseEther(
                `${config.reserveFactor}`,
            );
            if (!reserveFactor.eq(newReserveFactor)) {
                const tx2 = await cTokenContract._setReserveFactor(
                    newReserveFactor,
                );
                txPromises.push(tx2.wait());

                console.log(
                    "set reserve factor",
                    symbol,
                    newReserveFactor.toString(),
                );
            }
        }

        await Promise.all(txPromises);
    },
);
