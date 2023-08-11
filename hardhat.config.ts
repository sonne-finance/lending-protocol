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
        optimism: {
            chainId: 10,
            url: process.env.OPTIMISM_RPC_URL!,
            //ovm: true,
            accounts: [process.env.OPTIMISM_DEPLOYER_KEY!],
            verify: {
                etherscan: {
                    apiUrl: "https://api-optimistic.etherscan.io",
                    apiKey: process.env.OPTIMISM_ETHERSCAN_KEY,
                },
            },
        },
        base: {
            chainId: 8453,
            url: process.env.BASE_RPC_URL!,
            //ovm: true,
            accounts: [process.env.BASE_DEPLOYER_KEY!],
            verify: {
                etherscan: {
                    apiUrl: "https://api.basescan.org",
                    apiKey: process.env.BASE_ETHERSCAN_KEY,
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
