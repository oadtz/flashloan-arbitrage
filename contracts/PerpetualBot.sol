// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IFuture {
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
    ) external payable returns (bytes32 tradeHash);

    function closeTrade(bytes32 tradeHash) external;
}

contract PerpetualBot is Ownable {
    bytes32 private _lastTradeHash;
    address public immutable MARKET;

    constructor(address _market) Ownable(msg.sender) {
        MARKET = _market;
    }

    function openTradeBNB(
        address _token,
        bool _isLong,
        uint96 _amount,
        uint80 _qty,
        uint64 _price,
        uint64 _takeProfit
    ) external payable onlyOwner returns (bytes32 tradeHash) {
        require(address(this).balance >= _amount, "Insufficient balance");

        IFuture.OpenDataInput memory openData = IFuture.OpenDataInput({
            pairBase: _token,
            isLong: _isLong,
            tokenIn: address(0),
            amountIn: _amount,
            qty: _qty,
            price: _price,
            stopLoss: 0,
            takeProfit: _takeProfit,
            broker: 2
        });

        tradeHash = IFuture(MARKET).openMarketTradeBNB{value: _amount}(
            openData
        );

        _lastTradeHash = tradeHash;
    }

    function closeTrade() external onlyOwner {
        if (_lastTradeHash != 0) {
            IFuture(MARKET).closeTrade(_lastTradeHash);
            _lastTradeHash = 0;
        }
    }

    function withdrawBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function depositBNB() external payable {}

    receive() external payable {}
}
