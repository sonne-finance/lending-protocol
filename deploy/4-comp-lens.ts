import { DeployFunction } from "hardhat-deploy/dist/types";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy, getOrNull },
    ethers,
    network,
}) => {
    const { deployer } = await getNamedAccounts();

    await deploy("BasicLens", {
        from: deployer,
        args: [],
        log: true,
    });
};

export default func;
func.tags = ["lens"];
