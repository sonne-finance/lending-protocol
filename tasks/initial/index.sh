#!/bin/(shell)

# NETWORK=base \
# OWNER=0xfb59ce8986943163f14c590755b29db2998f2322 \
# sh ./tasks/initial/index.sh

npx hardhat deploy --network $NETWORK

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0x4200000000000000000000000000000000000006 \
--underlying-decimals 18 \
--underlying-name "Wrapped Ether" \
--underlying-symbol "WETH" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "MediumRateModel" \
--owner $OWNER \
--proxy true

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0xd9aaec86b65d86f6a7b5b1b0c42ffa531710b6ca \
--underlying-decimals 6 \
--underlying-name "USD Base Coin" \
--underlying-symbol "USDbC" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "StableRateModel" \
--owner $OWNER \
--proxy true

npx hardhat deploy-ctoken \
--network $NETWORK \
--underlying-address 0x50c5725949a6f0c72e6c4a641f24049a917db0cb \
--underlying-decimals 18 \
--underlying-name "Dai Stablecoin" \
--underlying-symbol "DAI" \
--decimals 8 \
--comptroller-key "Unitroller" \
--interest-rate-model-key "StableRateModel" \
--owner $OWNER \
--proxy true


npx hardhat deploy-price-oracle --network $NETWORK

npx hardhat update-price-oracle --network $NETWORK --price-oracle-key "ChainlinkPriceOracle"

npx hardhat support-markets --network $NETWORK