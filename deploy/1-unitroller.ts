import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";

const func: DeployFunction = async ({
    getNamedAccounts,
    deployments: { deploy, getOrNull },
    ethers,
    network,
}: HardhatRuntimeEnvironment) => {
    const { deployer } = await getNamedAccounts();

    let unitrollerDeploy = await getOrNull("Unitroller");
    console.log(unitrollerDeploy?.address);
    if (!unitrollerDeploy) {
        await deploy("Unitroller", {
            from: deployer,
            log: true,
            contract: "contracts/Unitroller.sol:Unitroller",
            args: [],
        });
    } else {
        console.log(`Unitroller already deployed at ${unitrollerDeploy.address}`);
    }
};

const tags = ["unitroller"];
export { tags };

export default func;
