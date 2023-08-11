import { Deployment } from "hardhat-deploy/types";
import { task, types } from "hardhat/config";

/**
 * npx hardhat upgrade-comptroller \
 * --network kava \
 */

task("upgrade-comptroller", "Upgrade Comptroller").setAction(
    async (args, hre, runSuper) => {
        const { address } = args;
        const {
            ethers,
            getNamedAccounts,
            deployments: { deploy, get, all },
        } = hre;

        const unitrollerDeploy = await get("Unitroller");
        const comptrollerDeploy = await get("Comptroller");
        const newImplementation = comptrollerDeploy.address;

        const unitroller = await ethers.getContractAt(
            "Unitroller",
            unitrollerDeploy.address,
        );
        const comptroller = await ethers.getContractAt(
            "Comptroller",
            comptrollerDeploy.address,
        );

        const comptrollerImplementation =
            await unitroller.comptrollerImplementation();
        if (
            comptrollerImplementation?.toLowerCase() ==
            newImplementation.toLowerCase()
        ) {
            throw new Error(
                `Comptroller implementation already set to ${newImplementation}`,
            );
        }

        const txs: any[] = [];

        const pendingImplementation =
            await unitroller.pendingComptrollerImplementation();

        if (
            pendingImplementation?.toLowerCase() !=
            newImplementation.toLowerCase()
        ) {
            txs.push(
                await unitroller._setPendingImplementation(
                    comptrollerDeploy.address,
                ),
            );
        }

        txs.push(await comptroller._become(unitroller.address));
    },
);
