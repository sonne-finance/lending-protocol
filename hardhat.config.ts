import * as dotenv from "dotenv";
dotenv.config();

import "hardhat-deploy";
import "@nomiclabs/hardhat-ethers";
import { HardhatUserConfig } from "hardhat/types";

import "./tasks";

/** @type import('hardhat/config').HardhatUserConfig */
const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      forking: {
        url: "https://endpoints.omniatech.io/v1/op/mainnet/public",
      },
      initialBaseFeePerGas: 100000000,
      gasPrice: 100000000,
    },
    localhost: {
      url: "http://localhost:8545",
      accounts: [process.env.localhost!],
    },
    ethereum: {
      url: "https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      gas: 6000000,
    },
    fantom: {
      chainId: 250,
      url: "https://rpc.ftm.tools",
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
      url: "https://mainnet.optimism.io",
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
