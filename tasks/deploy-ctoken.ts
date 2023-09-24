import { deployProxyImpl } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { task, types } from "hardhat/config";

/**
 * npx hardhat deploy-ctoken \
 * --network base \
 * --underlying-address 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 \
 * --underlying-decimals 6 \
 * --underlying-name "USD Coin" \
 * --underlying-symbol "USDC" \
 * --decimals 8 \
 * --comptroller-key "Unitroller" \
 * --interest-rate-model-key "StableRateModel" \
 * --owner 0x81077d101293eCa45114AF55A63897cEc8732Fd3 \
 * --proxy true
 */

task("deploy-ctoken", "Deploys a new ctoken")
    .addParam("underlyingAddress", "Underlying asset's address")
    .addParam(
        "underlyingDecimals",
        "Underlying asset's decimals",
        18,
        types.int,
    )
    .addParam("underlyingName", "Underlying asset's name")
    .addParam("underlyingSymbol", "Underlying asset's symbol")
    .addParam("decimals", "Decimals of the cToken", 8, types.int)
    .addParam("comptrollerKey", "Key of the comptroller")
    .addParam("interestRateModelKey", "Key of the interest rate model")
    .addParam("owner", "Owner of the cToken")
    .addParam(
        "proxy",
        "Deploys contract using default proxy",
        false,
        types.boolean,
        true,
    )
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
            proxy,
        } = args;
        const {
            ethers,
            getNamedAccounts,
            deployments: { deploy, get },
        } = hre;

        const { deployer } = await getNamedAccounts();

        const contractKeyPrefix = proxy
            ? "CErc20Upgradable_"
            : "CErc20Immutable_";

        const contractKey = `${contractKeyPrefix}${underlyingSymbol}`;
        const soName = `SonneBase ${underlyingName}`;
        const soSymbol = `sob${underlyingSymbol}`;

        const comptrollerDeploy = await get(comptrollerKey);
        const interestRateModelDeploy = await get(interestRateModelKey);
        const initialExchangeRateMantissa = ethers.parseUnits(
            "0.02",
            underlyingDecimals + 18 - decimals,
        );
        console.log(initialExchangeRateMantissa.toString());

        try {
            await get(contractKey);
        } catch {
            const args = [
                underlyingAddress,
                comptrollerDeploy.address,
                interestRateModelDeploy.address,
                initialExchangeRateMantissa,
                soName,
                soSymbol,
                decimals,
                owner,
            ];

            if (proxy) {
                await deploy(contractKey, {
                    from: deployer,
                    log: true,
                    contract: "contracts/CErc20Upgradable.sol:CErc20Upgradable",
                    proxy: {
                        owner: owner,
                        proxyContract: "OpenZeppelinTransparentProxy",
                        execute: {
                            init: {
                                methodName: "proxyInitialize",
                                args: args,
                            },
                        },
                    },
                });
            } else {
                await deploy(contractKey, {
                    from: deployer,
                    log: true,
                    contract: "contracts/CErc20Immutable.sol:CErc20Immutable",
                    args: args,
                });
            }
        }
    });
