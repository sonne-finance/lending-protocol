import { DeployFunction } from "hardhat-deploy/dist/types";

const func: DeployFunction = async ({
  getNamedAccounts,
  deployments,
  ethers,
  network,
}) => {
  const { deploy, get } = deployments;
  const { deployer } = await getNamedAccounts();

  await deploy("BasicLens", {
    from: deployer,
    args: [],
    log: true,
  });
};

export default func;
func.tags = ["lens"];
