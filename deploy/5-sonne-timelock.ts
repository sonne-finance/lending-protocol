import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { ethers } from "hardhat";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const [deployer] = await ethers.getSigners();

    const sonneTimelockDeploy = await deploy("SonneTimelockController", {
        from: deployer.address,
        log: true,
        contract:
            "contracts/SonneTimelockController.sol:SonneTimelockController",
        args: [10, [], [], deployer.address],
    });
};

export default func;
