import * as dotenv from "dotenv";
dotenv.config();

import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-toolbox";
import "@openzeppelin/hardhat-upgrades";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-deploy-ethers";
import { HardhatUserConfig } from "hardhat/config";

import "./tasks";

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
    networks: {
        hardhat: {
            chainId: 10,
            forking: {
                enabled: true,
                targetName: process.env.FORKING_NETWORK?.toLowerCase()!,
                url: process.env[
                    `${process.env.FORKING_NETWORK?.toUpperCase()}_RPC_URL`
                ]!,
                blockNumber: 109287000,
            },
            companionNetworks: {
                mainnet: "optimism",
            },
            autoImpersonate: true,
            gasPrice: 1000000000,
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
