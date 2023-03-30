import { task } from "hardhat/config";

import priceFeedConfig from "../config/price-feeds";

// npx hardhat deploy-price-oracle --network optimism

task(
  "deploy-price-oracle",
  "Deploys a price oracle from all tokens in deployments"
).setAction(async (args, hre, runSuper) => {
  const {
    ethers,
    getNamedAccounts,
    deployments: { deploy, getOrNull, all },
  } = hre;

  const { deployer } = await getNamedAccounts();

  const allDeployments = await all();
  const cTokenDeployments = Object.entries(allDeployments)
    .filter(([key, value]) => key.startsWith("CErc20Immutable_"))
    .map(([key, value]) => value);

  const cTickers = cTokenDeployments.map(
    (cTokenDeployment) => cTokenDeployment.args?.[5]
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
