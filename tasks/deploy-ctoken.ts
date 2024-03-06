import { deployProxyImpl } from "@openzeppelin/hardhat-upgrades/dist/utils";
import { task, types } from "hardhat/config";

/**
 * npx hardhat deploy-ctoken \
 * --network optimism \
 * --underlying-address 0x0b2c639c533813f4aa9d7837caf62653d097ff85 \
 * --underlying-decimals 6 \
 * --underlying-name "USD Coin" \
 * --underlying-symbol "USDCnative" \
 * --decimals 8 \
 * --comptroller-key "Unitroller" \
 * --interest-rate-model-key "StableRateModel" \
 * --proxy false
 */

const networkSettings = {
    optimism: {
        namePrefix: "Sonne ",
        tickerPrefix: "so",
        owner: "0x37fF10390F22fABDc2137E428A6E6965960D60b6",

    },
    base: {
        namePrefix: "SonneBase ",
        tickerPrefix: "sob",
        owner: "0x81077d101293eCa45114AF55A63897cEc8732Fd3"
    }
}

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
            proxy,
        } = args;
        const {
            network,
            ethers,
            getNamedAccounts,
            deployments: { deploy, get },
        } = hre;

        const { deployer } = await getNamedAccounts();

        const contractKeyPrefix = proxy
            ? "CErc20Upgradable_"
            : "CErc20Immutable_";

        const settings = networkSettings[network.name];

        const contractKey = `${contractKeyPrefix}${underlyingSymbol}`;
        const soName = `${settings.namePrefix}${underlyingName}`;
        const soSymbol = `${settings.tickerPrefix}${underlyingSymbol}`;

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
                settings.owner,
            ];

            if (proxy) {
                await deploy(contractKey, {
                    from: deployer,
                    log: true,
                    contract: "contracts/CErc20Upgradable.sol:CErc20Upgradable",
                    proxy: {
                        owner: settings.owner,
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
