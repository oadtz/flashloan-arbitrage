// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Future {
    struct OpenDataInput {
        // Pair.base
        address pairBase;
        bool isLong;
        // BUSD/USDT address
        address tokenIn;
        uint96 amountIn; // tokenIn decimals
        uint80 qty; // 1e10
        // Limit Order: limit price
        // Market Trade: worst price acceptable
        uint64 price; // 1e8
        uint64 stopLoss; // 1e8
        uint64 takeProfit; // 1e8
        uint24 broker;
    }

    function openMarketTradeBNB(
        OpenDataInput memory openData
    ) external payable returns (bytes32 tradeHash) {
        return 0x0;
    }

    function closeTrade(bytes32 tradeHash) external {}
}
