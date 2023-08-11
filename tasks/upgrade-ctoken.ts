import { Deployment } from "hardhat-deploy/types";
import { task, types } from "hardhat/config";

/**
 * npx hardhat upgrade-ctoken \
 * --network kava \
 * --address 0x350c4A0aC240755Bb6432FeB907eCAFbbBc75770
 */

task("upgrade-ctoken", "Upgrade CToken")
    .addParam("address", "Market's address")
    .setAction(async (args, hre, runSuper) => {
        const { address } = args;
        const {
            ethers,
            getNamedAccounts,
            deployments: { deploy, get, all },
        } = hre;

        const { deployer } = await getNamedAccounts();

        const allDeployments = await all();
        const deploymentKV = Object.entries(allDeployments).find(
            ([key, d]) =>
                d.address?.toLowerCase() == address?.toLowerCase() &&
                d.implementation !== undefined,
        );

        if (!deploymentKV) throw new Error("CToken deployment not found");
        const contractKey = deploymentKV[0];
        const deployment = deploymentKV[1];

        await deploy(contractKey, {
            from: deployer,
            log: true,
            contract: "contracts/CErc20Upgradable.sol:CErc20Upgradable",
            proxy: {
                proxyContract: "OpenZeppelinTransparentProxy",
                execute: {
                    init: {
                        methodName: "proxyInitialize",
                        args: (deployment as any).execute?.args,
                    },
                },
            },
        });
    });
