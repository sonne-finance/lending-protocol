import { task } from "hardhat/config";

import protocolConfig from "../protocol.config";
import { filterCTokenDeployments } from "./_utils";

// npx hardhat deploy-price-oracle --network optimism

task(
    "deploy-price-oracle",
    "Deploys a price oracle from all tokens in deployments",
).setAction(async (args, hre, runSuper) => {
    const {
        network,
        ethers,
        getNamedAccounts,
        deployments: { deploy, getOrNull, all },
    } = hre;

    const priceFeedConfig = protocolConfig[network.name].markets;

    const { deployer } = await getNamedAccounts();

    const allDeployments = await all();
    const cTokenDeployments = filterCTokenDeployments(allDeployments);

    const cTickers = cTokenDeployments.map((cTokenDeployment: any) =>
        !!cTokenDeployment.implementation
            ? cTokenDeployment.execute.args[5]
            : cTokenDeployment.args[5],
    );

    const priceFeeds = cTickers.map((cTicker) => {
        const soToken = priceFeedConfig[cTicker];
        if (!soToken) throw new Error(`No SO token found for ${cTicker}`);
        return soToken.priceFeed;
    });
    const baseUnits = cTickers.map((cTicker) => {
        const soToken = priceFeedConfig[cTicker];
        if (!soToken) throw new Error(`No SO token found for ${cTicker}`);
        return soToken.baseUnit;
    });

    const oracle = await deploy("ChainlinkPriceOracle", {
        from: deployer,
        log: true,
        contract:
            "contracts/PriceOracle/ChainlinkPriceOracle.sol:ChainlinkPriceOracle",
        args: [cTickers, priceFeeds, baseUnits],
    });
});
