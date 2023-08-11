export type ProtocolConfig = {
    [network: string]: ProtocolNetworkConfig;
};

export type ProtocolNetworkConfig = {
    timelock?: `0x${string}`;
    multisig?: `0x${string}`;
    priceFeeds: {
        [symbol: string]: PriceFeedConfig;
    };
};

export type PriceFeedConfig = {
    source: "chainlink";
    priceFeed: `0x${string}`;
    baseUnit: `1${string}`;
};
