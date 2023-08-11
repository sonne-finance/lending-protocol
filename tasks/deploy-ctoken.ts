import { task, types } from "hardhat/config";

/**
 * npx hardhat deploy-ctoken \
 * --network optimism \
 * --underlying-address 0xdFA46478F9e5EA86d57387849598dbFB2e964b02 \
 * --underlying-decimals 18 \
 * --underlying-name "miMatic" \
 * --underlying-symbol "MAI" \
 * --decimals 8 \
 * --comptroller-key "Unitroller" \
 * --interest-rate-model-key "MediumRateModel" \
 * --owner 0x37fF10390F22fABDc2137E428A6E6965960D60b6
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
        const initialExchangeRateMantissa = ethers.utils.parseUnits(
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
