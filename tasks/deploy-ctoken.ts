import { task, types } from "hardhat/config";

/**
 * npx hardhat deploy-ctoken \
 * --network optimism \
 * --underlying-address 0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb \
 * --underlying-decimals 18 \
 * --underlying-name "Wrapped liquid staked Ether 2.0" \
 * --underlying-symbol "wstETH" \
 * --decimals 8 \
 * --comptroller-key "ComptrollerV1" \
 * --interest-rate-model-key "MediumRateModel" \
 * --owner 0x37fF10390F22fABDc2137E428A6E6965960D60b6
 */

task("deploy-ctoken", "Deploys a new ctoken")
  .addParam("underlyingAddress", "Underlying asset's address")
  .addParam("underlyingDecimals", "Underlying asset's decimals", 18, types.int)
  .addParam("underlyingName", "Underlying asset's name")
  .addParam("underlyingSymbol", "Underlying asset's symbol")
  .addParam("decimals", "Decimals of the cToken", 8, types.int)
  .addParam("comptrollerKey", "Key of the comptroller")
  .addParam("interestRateModelKey", "Key of the interest rate model")
  .addParam("owner", "Owner of the cToken")
  .setAction(async (args, hre, runSuper) => {
    const {
      underlyingAddress,
      underlyingDecimals,
      underlyingName,
      underlyingSymbol,
      decimals,
      comptrollerKey,
      interestRateModelKey,
      owner,
    } = args;
    const {
      ethers,
      getNamedAccounts,
      deployments: { deploy, get },
    } = hre;

    const { deployer } = await getNamedAccounts();

    const contractKey = `CErc20Immutable_${underlyingSymbol}`;
    const soName = `Sonne ${underlyingName}`;
    const soSymbol = `so${underlyingSymbol}`;

    let cToken;

    const comptrollerDeploy = await get(comptrollerKey);
    const interestRateModelDeploy = await get(interestRateModelKey);
    const initialExchangeRateMantissa = ethers.utils.parseUnits(
      "0.02",
      underlyingDecimals + 18 - decimals
    );

    try {
      cToken = await get(contractKey);
    } catch {
      console.log("deploying from", deployer);
      cToken = await deploy(contractKey, {
        from: deployer,
        log: true,
        contract: "contracts/CErc20Immutable.sol:CErc20Immutable",
        args: [
          underlyingAddress,
          comptrollerDeploy.address,
          interestRateModelDeploy.address,
          initialExchangeRateMantissa,
          soName,
          soSymbol,
          decimals,
          owner,
        ],
      });
    }
  });
