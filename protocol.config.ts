import { ProtocolConfig } from "./types";

const config: ProtocolConfig = {
    optimism: {
        timelock: "0x37fF10390F22fABDc2137E428A6E6965960D60b6",
        multisig: "0x784B82a27029C9E114b521abcC39D02B3D1DEAf2",
        markets: {
            soDAI: {
                source: "chainlink",
                priceFeed: "0x8dBa75e83DA73cc766A7e5a0ee71F656BAb470d6",
                baseUnit: "1000000000000000000",
            },
            soUSDT: {
                source: "chainlink",
                priceFeed: "0xECef79E109e997bCA29c1c0897ec9d7b03647F5E",
                baseUnit: "1000000",
            },
            soUSDC: {
                source: "chainlink",
                priceFeed: "0x16a9FA2FDa030272Ce99B29CF780dFA30361E0f3",
                baseUnit: "1000000",
            },
            soOP: {
                source: "chainlink",
                priceFeed: "0x0D276FC14719f9292D5C1eA2198673d1f4269246",
                baseUnit: "1000000000000000000",
            },
            soWETH: {
                source: "chainlink",
                priceFeed: "0x13e3Ee699D1909E989722E753853AE30b17e08c5",
                baseUnit: "1000000000000000000",
            },
            soSUSD: {
                source: "chainlink",
                priceFeed: "0x7f99817d87baD03ea21E05112Ca799d715730efe",
                baseUnit: "1000000000000000000",
            },
            soSNX: {
                source: "chainlink",
                priceFeed: "0x2FCF37343e916eAEd1f1DdaaF84458a359b53877",
                baseUnit: "1000000000000000000",
            },
            soWBTC: {
                source: "chainlink",
                priceFeed: "0x718A5788b89454aAE3A028AE9c111A29Be6c2a6F",
                baseUnit: "100000000",
            },
            soLUSD: {
                source: "chainlink",
                priceFeed: "0x9dfc79Aaeb5bb0f96C6e9402671981CdFc424052",
                baseUnit: "1000000000000000000",
            },
            sowstETH: {
                source: "chainlink",
                priceFeed: "0x698B585CbC4407e2D54aa898B2600B53C68958f7",
                baseUnit: "1000000000000000000",
            },
            soMAI: {
                source: "chainlink",
                priceFeed: "0x73A3919a69eFCd5b19df8348c6740bB1446F5ed0",
                baseUnit: "1000000000000000000",
            },
        },
    },
    base: {
        markets: {
            sobWETH: {
                source: "chainlink",
                priceFeed: "0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70",
                baseUnit: "1000000000000000000",
                reserveFactor: 0.15,
                collateralFactor: 0.70
            },
            sobUSDbC: {
                source: "chainlink",
                priceFeed: "0x7e860098F58bBFC8648a4311b374B1D669a2bc6B",
                baseUnit: "1000000",
                reserveFactor: 0.13,
                collateralFactor: 0.85
            },
            sobDAI: {
                source: "chainlink",
                priceFeed: "0x591e79239a7d679378eC8c847e5038150364C78F",
                baseUnit: "1000000000000000000",
                reserveFactor: 0.13,
                collateralFactor: 0.85
            },
        },
    },
};

export default config;
