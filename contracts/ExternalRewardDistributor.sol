// SPDX-License-Identifier: BSD-3-Clause
pragma solidity ^0.8.10;

import "./Ownership/Ownable.sol";

import "./EIP20Interface.sol";
import "./Comptroller.sol";
import "./ExponentialNoError.sol";

struct CompMarketState {
    // The market's last updated compBorrowIndex or compSupplyIndex
    uint224 index;
    // The block number the index was last updated at
    uint32 block;
}

struct RewardMarketState {
    /// @notice The supply speed for each market
    uint256 supplySpeed;
    /// @notice The borrow speed for each market
    uint256 borrowSpeed;
    /// @notice The supply index for each market
    uint224 supplyIndex;
    /// @notice The last block number that Reward accrued for supply
    uint32 supplyBlock;
    /// @notice The borrow index for each market
    uint224 borrowIndex;
    /// @notice The last block number that Reward accrued for borrow
    uint32 borrowBlock;
}

struct RewardAccountState {
    /// @notice The supply index for each market as of the last time they accrued Reward
    mapping(address => uint256) supplierIndex;
    /// @notice The borrow index for each market as of the last time they accrued Reward
    mapping(address => uint256) borrowerIndex;
    /// @notice Accrued but not yet transferred for each token
    uint256 rewardAccrued;
}

contract ExternalRewardDistributorV1 is Ownable, ExponentialNoError {
    /// @notice The initial reward index for a market
    uint224 public constant rewardInitialIndex = 1e36;

    /// @notice The comptroller that rewards are distributed to
    Comptroller public comptroller;

    /// @notice The Reward state for each reward token for each market
    mapping(address => mapping(address => RewardMarketState))
        public rewardMarketState;

    /// @notice The Reward state for each reward token for each account
    mapping(address => mapping(address => RewardAccountState))
        public rewardAccountState;

    address[] public rewardTokens;
    mapping(address => bool) public rewardTokenExists;

    modifier onlyComptroller() {
        require(
            msg.sender == address(comptroller),
            "RewardDistributor: only comptroller can call this function"
        );
        _;
    }

    constructor(address comptroller_) {
        comptroller = Comptroller(comptroller_);
    }

    function _initializeReward(
        address rewardToken_,
        uint32 startBlockNumber,
        address[] memory markets,
        uint256[] memory supplySpeeds,
        uint256[] memory borrowSpeeds
    ) public onlyOwner {
        require(
            rewardToken_ != address(0),
            "RewardDistributor: reward token cannot be zero address"
        );
        require(
            !rewardTokenExists[rewardToken_],
            "RewardDistributor: reward token already exists"
        );
        require(
            markets.length == supplySpeeds.length,
            "RewardDistributor: supply speed array length mismatch"
        );
        require(
            markets.length == borrowSpeeds.length,
            "RewardDistributor: borrow speed array length mismatch"
        );

        for (uint256 i = 0; i < markets.length; i++) {
            address cToken = markets[i];
            RewardMarketState storage marketState = rewardMarketState[
                rewardToken_
            ][cToken];
            marketState.supplySpeed = supplySpeeds[i];
            marketState.borrowSpeed = borrowSpeeds[i];
            marketState.supplyIndex = rewardInitialIndex;
            marketState.supplyBlock = startBlockNumber;
            marketState.borrowIndex = rewardInitialIndex;
            marketState.borrowBlock = startBlockNumber;
        }

        rewardTokens.push(rewardToken_);
    }

    function _updateRewardSpeeds(
        address rewardToken_,
        address[] memory markets,
        uint256[] memory supplySpeeds,
        uint256[] memory borrowSpeeds
    ) public onlyOwner {
        require(
            rewardToken_ != address(0),
            "RewardDistributor: reward token cannot be zero address"
        );
        require(
            rewardTokenExists[rewardToken_],
            "RewardDistributor: reward token does not exist"
        );
        require(
            markets.length == supplySpeeds.length,
            "RewardDistributor: supply speed array length mismatch"
        );
        require(
            markets.length == borrowSpeeds.length,
            "RewardDistributor: borrow speed array length mismatch"
        );

        for (uint256 i = 0; i < markets.length; i++) {
            address cToken = markets[i];
            RewardMarketState storage marketState = rewardMarketState[
                rewardToken_
            ][cToken];
            marketState.supplySpeed = supplySpeeds[i];
            marketState.borrowSpeed = borrowSpeeds[i];
        }
    }

    function notifySupplyIndex(CToken cToken) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifySupplyIndexInternal(rewardTokens[i], cToken);
        }
    }

    function notifySupplyIndexInternal(
        address rewardToken,
        CToken cToken
    ) internal {
        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            address(cToken)
        ];

        uint32 blockNumber = getBlockNumber();

        if (blockNumber > marketState.supplyBlock) {
            uint256 deltaBlocks = blockNumber - marketState.supplyBlock;

            if (marketState.supplySpeed > 0) {
                uint256 supplyTokens = CToken(cToken).totalSupply();
                uint256 accrued = mul_(deltaBlocks, marketState.supplySpeed);
                Double memory ratio = supplyTokens > 0
                    ? fraction(accrued, supplyTokens)
                    : Double({mantissa: 0});
                marketState.supplyIndex = safe224(
                    add_(Double({mantissa: marketState.supplyIndex}), ratio)
                        .mantissa,
                    "new index exceeds 224 bits"
                );
            }

            marketState.supplyBlock = blockNumber;
        }
    }

    function notifyBorrowIndex(
        address cToken,
        Exp memory marketBorrowIndex
    ) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifyBorrowIndexInternal(
                rewardTokens[i],
                cToken,
                marketBorrowIndex
            );
        }
    }

    function notifyBorrowIndexInternal(
        address rewardToken,
        address cToken,
        Exp memory marketBorrowIndex
    ) internal {
        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];

        uint32 blockNumber = getBlockNumber();

        if (blockNumber > marketState.borrowBlock) {
            uint256 deltaBlocks = blockNumber - marketState.borrowBlock;

            if (marketState.borrowSpeed > 0) {
                uint256 borrowAmount = div_(
                    CToken(cToken).totalBorrows(),
                    marketBorrowIndex
                );
                uint256 accrued = mul_(deltaBlocks, marketState.borrowSpeed);
                Double memory ratio = borrowAmount > 0
                    ? fraction(accrued, borrowAmount)
                    : Double({mantissa: 0});
                marketState.borrowIndex = safe224(
                    add_(Double({mantissa: marketState.borrowIndex}), ratio)
                        .mantissa,
                    "new index exceeds 224 bits"
                );
            }

            marketState.borrowBlock = blockNumber;
        }
    }

    function notifySupplier(
        address cToken,
        address supplier
    ) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifySupplierInternal(rewardTokens[i], cToken, supplier);
        }
    }

    function notifySupplierInternal(
        address rewardToken,
        address cToken,
        address supplier
    ) internal {
        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];
        RewardAccountState storage accountState = rewardAccountState[
            rewardToken
        ][supplier];

        uint256 supplyIndex = marketState.supplyIndex;
        uint256 supplierIndex = accountState.supplierIndex[cToken];

        // Update supplier's index to the current index since we are distributing accrued Reward
        accountState.supplierIndex[cToken] = supplyIndex;

        if (supplierIndex == 0 && supplyIndex >= rewardInitialIndex) {
            supplierIndex = rewardInitialIndex;
        }

        // Calculate change in the cumulative sum of the Reward per cToken accrued
        Double memory deltaIndex = Double({
            mantissa: sub_(supplyIndex, supplierIndex)
        });

        uint256 supplierTokens = CToken(cToken).balanceOf(supplier);

        // Calculate Reward accrued: cTokenAmount * accruedPerCToken
        uint256 supplierDelta = mul_(supplierTokens, deltaIndex);

        accountState.rewardAccrued = add_(
            accountState.rewardAccrued,
            supplierDelta
        );
    }

    function notifyBorrower(
        address cToken,
        address borrower,
        Exp memory marketBorrowIndex
    ) external onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            notifyBorrowerInternal(
                rewardTokens[i],
                cToken,
                borrower,
                marketBorrowIndex
            );
        }
    }

    function notifyBorrowerInternal(
        address rewardToken,
        address cToken,
        address borrower,
        Exp memory marketBorrowIndex
    ) internal {
        RewardMarketState storage marketState = rewardMarketState[rewardToken][
            cToken
        ];
        RewardAccountState storage accountState = rewardAccountState[
            rewardToken
        ][borrower];

        uint256 borrowIndex = marketState.borrowIndex;
        uint256 borrowerIndex = accountState.borrowerIndex[cToken];

        // Update borrowers's index to the current index since we are distributing accrued Reward
        accountState.borrowerIndex[cToken] = borrowIndex;

        if (borrowerIndex == 0 && borrowIndex >= rewardInitialIndex) {
            // Covers the case where users borrowed tokens before the market's borrow state index was set.
            // Rewards the user with Reward accrued from the start of when borrower rewards were first
            // set for the market.
            borrowerIndex = rewardInitialIndex;
        }

        // Calculate change in the cumulative sum of the Reward per borrowed unit accrued
        Double memory deltaIndex = Double({
            mantissa: sub_(borrowIndex, borrowerIndex)
        });

        uint256 borrowerAmount = div_(
            CToken(cToken).borrowBalanceStored(borrower),
            marketBorrowIndex
        );

        // Calculate COMP accrued: cTokenAmount * accruedPerBorrowedUnit
        uint256 borrowerDelta = mul_(borrowerAmount, deltaIndex);

        accountState.rewardAccrued = add_(
            accountState.rewardAccrued,
            borrowerDelta
        );
    }

    function claim(address[] memory holders) public onlyComptroller {
        for (uint256 i = 0; i < rewardTokens.length; i++) {
            claimInternal(rewardTokens[i], holders);
        }
    }

    function claimInternal(
        address rewardToken,
        address[] memory holders
    ) internal {
        for (uint256 j = 0; j < holders.length; j++) {
            RewardAccountState storage accountState = rewardAccountState[
                rewardToken
            ][holders[j]];

            accountState.rewardAccrued = grantRewardInternal(
                rewardToken,
                holders[j],
                accountState.rewardAccrued
            );
        }
    }

    function getBlockNumber() internal view returns (uint32) {
        return safe32(block.timestamp, "block number exceeds 32 bits");
    }

    /**
     * @notice Transfer Reward to the user
     * @dev Note: If there is not enough Reward, we do not perform the transfer all.
     * @param user The address of the user to transfer Reward to
     * @param amount The amount of Reward to (possibly) transfer
     * @return The amount of Reward which was NOT transferred to the user
     */
    function grantRewardInternal(
        address token,
        address user,
        uint256 amount
    ) internal returns (uint256) {
        uint256 remaining = EIP20Interface(token).balanceOf(address(this));
        if (amount > 0 && amount <= remaining) {
            EIP20Interface(token).transfer(user, amount);
            return 0;
        }
        return amount;
    }
}
