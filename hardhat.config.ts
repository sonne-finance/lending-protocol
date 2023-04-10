import * as dotenv from "dotenv";
dotenv.config();

import "@nomicfoundation/hardhat-network-helpers";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-deploy";
import { HardhatUserConfig } from "hardhat/config";
import "solidity-coverage";

import "./tasks";

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            chainId: 10,
            companionNetworks: {
                mainnet: process.env.FORKING_NETWORK?.toLowerCase()!,
            },
            forking: {
                enabled: true,
                url: process.env[
                    `${process.env.FORKING_NETWORK?.toUpperCase()}_RPC_URL`
                ]!,
            },
            autoImpersonate: true,
            gasPrice: 1000000000,
        },
        localhost: {
            url: "http://localhost:8545",
            accounts: [process.env.localhost!],
        },
        fantom: {
            chainId: 250,
            url: process.env.FANTOM_RPC_URL!,
            accounts: [process.env.FANTOM_DEPLOYER_KEY!],
            gasPrice: 15000000000,
            verify: {
                etherscan: {
                    apiUrl: "https://api.ftmscan.com",
                    apiKey: process.env.FANTOM_ETHERSCAN_API_KEY,
                },
            },
        },
        optimism: {
            chainId: 10,
            url: process.env.OPTIMISM_RPC_URL!,
            //ovm: true,
            accounts: [process.env.OPTIMISM_DEPLOYER_KEY!],
            verify: {
                etherscan: {
                    apiUrl: "https://api-optimistic.etherscan.io",
                    apiKey: process.env.OPTMISM_ETHERSCAN_API_KEY,
                },
            },
        },
    },
    solidity: {
        compilers: [
            {
                version: "0.5.16",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.6.12",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
            {
                version: "0.8.10",
                settings: {
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    namedAccounts: {
        deployer: 0,
    },
};

export default config;
