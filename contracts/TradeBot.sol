// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

interface IRouter {
    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts);
    function swapExactETHForTokens(uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external payable returns (uint256[] memory amounts);
    function swapExactTokensForETH(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) external returns (uint256[] memory amounts);
}

contract TradeBot is Ownable {
    using SafeERC20 for IERC20;

    struct Trade {
        uint256 amountETH;
        uint256 amountToken;
    }

    struct TradeData {
        address bestRouter;
        uint256 amountIn; // Note that amountIn is always be in the different unit from amountOut
        uint256 amountOut;
        uint256 profit; // Profit is in the same unit as amountOut (lastTradedAmountOut - amountOut)
    }

    mapping(address => Trade) private _trades;
    address public immutable WETH;

    constructor(address _wethAddress) Ownable(msg.sender) {
        WETH = _wethAddress;
        // console.log("TradeBot deployed");
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 amountNeeded) internal {
        uint256 currentAllowance = token.allowance(address(this), spender);
        if(currentAllowance < amountNeeded) {
            token.approve(spender, 0);
            token.approve(spender, type(uint256).max);
        }
    }

    function checkTrade(
        address[] calldata routers,
        address token,
        uint256 gasCostLimitInWei
    ) external view returns (string memory direction, address router, uint256 amountETH, uint256 amountToken) {
        // Calculate initial and target amounts for both sides.
        // console.log("Checking trade from ETH to Token");
        TradeData memory ethToTokenResult = getTradeAnalysis(routers, WETH, token, gasCostLimitInWei);
        uint256 ethToTokenProfitRatio = ethToTokenResult.amountOut > 0 ? (ethToTokenResult.profit * 100) / ethToTokenResult.amountOut : 0;
        // console.log("ETH to Token result:", ethToTokenResult.amountIn, ethToTokenResult.amountOut);
        // console.log("ETH to Token profit ratio:", ethToTokenProfitRatio);

        // console.log("Checking trade from Token to ETH");
        TradeData memory tokenToETHResult = getTradeAnalysis(routers, token, WETH, gasCostLimitInWei);
        uint256 tokenToETHProfitRatio = tokenToETHResult.amountOut > 0 ? (tokenToETHResult.profit * 100) / tokenToETHResult.amountOut : 0;
        // console.log("Token to ETH result:", tokenToETHResult.amountIn, tokenToETHResult.amountOut, tokenToETHResult.profit);
        // console.log("Token to ETH profit ratio:", tokenToETHProfitRatio);

        // Determine direction based on return profits
        if (ethToTokenProfitRatio > tokenToETHProfitRatio) {
            // amoutIn is in ETH, amountOut is in Token, profit is in Token
            return ("eth_to_token", ethToTokenResult.bestRouter, ethToTokenResult.amountIn, ethToTokenResult.amountOut);
        } else if (tokenToETHProfitRatio > ethToTokenProfitRatio) {
            // amoutIn is in Token, amountOut is in ETH, profit is in ETH
            return ("token_to_eth", tokenToETHResult.bestRouter, tokenToETHResult.amountOut, tokenToETHResult.amountIn);
        } else {
            return ("none", address(0), 0, 0);
        }
    }

    function getTradeAnalysis(
        address[] calldata routers,
        address tokenIn,
        address tokenOut,
        uint256 gasCostLimitInWei
    ) internal view returns (TradeData memory tradeData) {
        // Calculate the actual amount in
        uint256 currentTokenInBalance = tokenIn == WETH ? address(this).balance : IERC20(tokenIn).balanceOf(address(this));
        // console.log("Current tokenIn in balance:", currentTokenInBalance);
        uint256 lastTradeOfTokenIn = tokenIn == WETH ? _trades[tokenOut].amountETH : _trades[tokenIn].amountToken;
        // uint256 lastTradeOfTokenOut = tokenIn == WETH ? _trades[tokenOut].amountToken : _trades[tokenIn].amountETH;
        // uint256 expectedAmountOut = currentTokenInBalance >= lastTradeOfTokenIn ? lastTradeOfTokenOut : 0;
        uint256 expectedAmountOut = 0;

        // Find the best router
        tradeData.bestRouter = address(0);
        tradeData.amountIn = lastTradeOfTokenIn > 0 ? min(currentTokenInBalance, lastTradeOfTokenIn) : currentTokenInBalance;
        // console.log("Amount in (actual):", tradeData.amountIn);
        tradeData.amountOut = expectedAmountOut;
        // console.log("Amount out (expected):", tradeData.amountOut);
        tradeData.profit = 0;

        if (tradeData.amountIn > 0) {
            for (uint8 i = 0; i < routers.length; i++) {
                uint256 amountOut = getAmountOut(routers[i], tokenIn, tokenOut, tradeData.amountIn);
                // console.log("Amount out (actual) for router:", i, amountOut);

                if (amountOut > tradeData.amountOut) {
                    tradeData.bestRouter = routers[i];
                    tradeData.amountOut = amountOut;

                    // Calculate the profit
                    uint256 gasCostLimit = tokenOut == WETH ? gasCostLimitInWei : (gasCostLimitInWei * amountOut) / tradeData.amountIn;
                    // console.log("Gas cost limit for router:", i, gasCostLimit);
                    tradeData.profit = amountOut > gasCostLimit + expectedAmountOut ? amountOut - gasCostLimit - expectedAmountOut : 0;
                    // console.log("Profit (actual):", tradeData.profit);
                }
            }
        }

        // console.log("Best router:", tradeData.bestRouter);
        // console.log("Amount out:", tradeData.amountOut);
        // console.log("Profit:", tradeData.profit);
    }


    function executeTradeETHForTokens(
        address router,
        address token,
        uint256 amountIn,
        uint256 amountOutMin
    ) external onlyOwner {
        // console.log("Executing trade ETH for Tokens");
        // console.log("Router:", router);
        // console.log("Token:", token);
        // console.log("Amount in:", amountIn);
        // console.log("Amount out min:", amountOutMin);
        // console.log("Contract ETH balance:", address(this).balance);

        require(address(this).balance >= amountIn, "Insufficient contract ETH balance");

        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = token;

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IRouter(router).swapExactETHForTokens{ value: amountIn }(amountOutMin, path, address(this), block.timestamp);
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));

        require(balanceAfter > balanceBefore, "Trade execution failed");

        _trades[token] = Trade(amountIn, balanceAfter - balanceBefore);
        // console.log("Current _trades:", _trades[token].amountETH, _trades[token].amountToken);
    }

    function executeTradeTokensForETH(
        address router,
        address token,
        uint256 amountIn,
        uint256 amountOutMin
    ) external onlyOwner {
        // console.log("Executing trade Tokens for ETH");
        // console.log("Router:", router);
        // console.log("Token:", token);
        // console.log("Amount in:", amountIn);
        // console.log("Amount out min:", amountOutMin);
        // console.log("Contract token balance:", IERC20(token).balanceOf(address(this)));

        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = WETH;

        safeIncreaseAllowance(IERC20(token), router, amountIn);

        uint256 balanceBefore = address(this).balance;
        IRouter(router).swapExactTokensForETH(amountIn, amountOutMin, path, address(this), block.timestamp);
        uint256 balanceAfter = address(this).balance;

        require(balanceAfter > balanceBefore, "Trade execution failed");

        _trades[token] = Trade(balanceAfter - balanceBefore, amountIn);
        // console.log("Current _trades:", _trades[token].amountETH, _trades[token].amountToken);
    }

    function getAmountOut(address router, address tokenIn, address tokenOut, uint256 amountIn) internal view returns (uint256) {
        address[] memory path;
        if (tokenIn == WETH) {
            path = new address[](2);
            path[0] = WETH;
            path[1] = tokenOut;
        } else if (tokenOut == WETH) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = WETH;
        } 

        uint256[] memory amounts = IRouter(router).getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    function getTrades(address token) external view returns (uint256, uint256) {
        return (_trades[token].amountETH, _trades[token].amountToken);
    }

    function getTokenBalance(address token) external view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function withdrawToken(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function approveDeposit(address token, uint256 amount) external onlyOwner {
        safeIncreaseAllowance(IERC20(token), msg.sender, amount);
    }

    function depositToken(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function depositETH() external payable {}

    receive() external payable {}
}