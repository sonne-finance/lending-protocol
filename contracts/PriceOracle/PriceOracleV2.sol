// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.10;

import "../PriceOracle.sol";

interface IAggregatorV3 {
    function decimals() external view returns (uint8);

    function latestRoundData()
        external
        view
        returns (
            uint80 roundId,
            int256 answer,
            uint256 startedAt,
            uint256 updatedAt,
            uint80 answeredInRound
        );
}

interface ICToken {
    function underlying() external view returns (address);
}

struct PriceConfig {
    address feed;
    string toSymbol;
    uint256 underlyingDecimals;
}

contract PriceOracleV2 is PriceOracle {
    mapping(string => PriceConfig) public configs;

    constructor(string[] memory symbols_, PriceConfig[] memory configs_) {
        for (uint256 i = 0; i < symbols_.length; i++) {
            configs[symbols_[i]] = configs_[i];
        }
    }

    // price in usd with 18 decimals
    function getPrice(CToken cToken) public view returns (uint256) {
        string memory symbol = cToken.symbol();
        return _getPriceUSD(symbol);
    }

    function getPrice(string memory symbol) public view returns (uint256) {
        return _getPriceUSD(symbol);
    }

    function getUnderlyingPrice(
        CToken cToken
    ) external view override returns (uint256) {
        string memory symbol = cToken.symbol();
        return _getUnderlyingPrice(symbol);
    }

    // price is extended for comptroller usage based on decimals of exchangeRate
    function getUnderlyingPrice(
        string memory symbol
    ) external view returns (uint256) {
        return _getUnderlyingPrice(symbol);
    }

    function _getUnderlyingPrice(
        string memory symbol
    ) internal view returns (uint256) {
        PriceConfig memory config = configs[symbol];
        if (config.feed == address(0)) revert("missing priceFeed");

        uint256 priceUsd = _getPriceUSD(symbol);

        return priceUsd * 10 ** (18 - config.underlyingDecimals);
    }

    function _getPriceUSD(
        string memory symbol
    ) internal view returns (uint256) {
        PriceConfig memory config = configs[symbol];
        if (config.feed == address(0)) revert("missing priceFeed");

        uint256 feedDecimals = IAggregatorV3(config.feed).decimals();

        (uint256 feedPrice, ) = _getLatestPrice(config);
        uint256 price = feedPrice * 10 ** (18 - feedDecimals);

        if (
            keccak256(abi.encodePacked(config.toSymbol)) !=
            keccak256(abi.encodePacked("USD"))
        ) {
            price = (price * _getPriceUSD(config.toSymbol)) / 10 ** 18;
        }

        return price;
    }

    function _getLatestPrice(
        PriceConfig memory config
    ) internal view returns (uint256, uint256) {
        (
            ,
            //uint80 roundID
            int256 price, //uint256 startedAt
            ,
            uint256 timeStamp, //uint80 answeredInRound

        ) = IAggregatorV3(config.feed).latestRoundData();

        require(price > 0, "price cannot be zero");
        uint256 uPrice = uint256(price);

        return (uPrice, timeStamp);
    }
}
