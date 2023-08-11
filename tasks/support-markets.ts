import { task } from "hardhat/config";

import protocolConfig from "../protocol.config";
import { filterCTokenDeployments } from "./_utils";

// npx hardhat support-markets --network $NETWORK

task(
    "support-markets",
    "Supports missing markets to the comptroller",
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

    const ComptrollerProxy = await ethers.getContract("Unitroller");
    const Comptroller = await ethers.getContractAt(
        "Comptroller",
        ComptrollerProxy.address,
    );

    const existingCTokens = await Comptroller.getAllMarkets();
    const missingCTokens = cTokenDeployments
        .filter(
            (cTokenDeployment) =>
                !existingCTokens.includes(cTokenDeployment.address),
        )
        .map((cTokenDeployment) => cTokenDeployment.address);

    const txPromises: any[] = [];

    for (const cToken of missingCTokens) {
        const cTokenContract = await ethers.getContractAt(
            "CErc20Immutable",
            cToken,
        );
        const symbol = await cTokenContract.symbol();
        const config = priceFeedConfig[symbol];

        console.log("adding market", symbol);

        // support market
        const tx = await Comptroller._supportMarket(cToken);
        txPromises.push(tx.wait());
    }

    await Promise.all(txPromises);
});
