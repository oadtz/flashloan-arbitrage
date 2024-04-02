// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

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

    struct TradeAnalysis {
        address bestRouter;
        uint256 amount;
        uint256 profit;
    }

    struct TradeData {
        address[] routers;
        address tokenIn;
        address tokenOut;
        uint256 amountIn;
        uint256 amountOutMin;
        uint256 gasCostLimitInWei;
    }

    mapping(address => Trade) private _trades;

    constructor() Ownable(msg.sender) {
        console.log("TradeBot deployed");
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 amountNeeded) internal {
        uint256 currentAllowance = token.allowance(address(this), spender);
        if(currentAllowance < amountNeeded) {
            token.safeApprove(spender, 0);
            token.safeApprove(spender, type(uint256).max);
        }
    }

    function checkTrade(
        address[] calldata routers,
        address token,
        uint256 gasCostLimitInWei
    ) external view returns (string memory direction, address bestRouter, uint256 amountETH, uint256 amountToken) {
        uint256 currentETHBalance = address(this).balance;
        uint256 currentTokenBalance = IERC20(token).balanceOf(address(this));

        console.log("Current ETH balance:", currentETHBalance);
        console.log("Current Token balance:", currentTokenBalance);

        uint256 baseAmountETH = _trades[token].amountETH > 0 ? min(_trades[token].amountETH, currentETHBalance) : currentETHBalance;
        uint256 baseAmountToken = _trades[token].amountToken > 0 ? min(_trades[token].amountToken, currentTokenBalance) : currentTokenBalance;

        console.log("Base amount ETH:", baseAmountETH);
        console.log("Base amount Token:", baseAmountToken);

        if (baseAmountETH == 0 && baseAmountToken == 0) {
            console.log("No balance for ETH and Token");

            return ("none", address(0), 0, 0);
        }

        // Analyze the best trade for ETH to Token and Token to ETH
        TradeData memory ethToTokenData = TradeData(routers, address(0), token, baseAmountETH, baseAmountToken, gasCostLimitInWei);
        TradeData memory tokenToETHData = TradeData(routers, token, address(0), baseAmountToken, baseAmountETH, gasCostLimitInWei);

        console.log("Getting best trade analysis for ETH to Token");
        TradeAnalysis memory ethToToken = getBestTradeAnalysis(ethToTokenData);
        console.log("Getting best trade analysis for Token to ETH");
        TradeAnalysis memory tokenToETH = getBestTradeAnalysis(tokenToETHData);

        console.log("ETH to Token best router:", ethToToken.bestRouter, "Profit:", ethToToken.profit); // Unit in Token
        console.log("Token to ETH best router:", tokenToETH.bestRouter, "Profit:", tokenToETH.profit); // Unit in ETH

        // Determine direction based on profit exceeding the gas cost limit
        if (tokenToETH.profit > ethToToken.profit) {
            return ("to_eth", tokenToETH.bestRouter, tokenToETH.amount, baseAmountToken);
        } else if (ethToToken.profit > tokenToETH.profit) {
            return ("to_token", ethToToken.bestRouter, baseAmountETH, ethToToken.amount);
        } else {
            return ("none", address(0), 0, 0);
        }
    }

    function getBestTradeAnalysis(
        TradeData memory tradeData
    ) internal view returns (TradeAnalysis memory analysis) {
        uint256 bestProfit = 0;

        for (uint256 i = 0; i < tradeData.routers.length; i++) {
            console.log("i:", i);
            console.log("Token in:", tradeData.tokenIn);
            console.log("Token out:", tradeData.tokenOut);
            uint256 amountOut = tradeData.amountIn == 0 ? 0 : getAmountOut(tradeData.routers[i], tradeData.tokenIn, tradeData.tokenOut, tradeData.amountIn);
            console.log("Amount In:", tradeData.amountIn);
            console.log("baseAmountTarget:", tradeData.amountOutMin);
            console.log("amountOut:", amountOut);
            uint256 profit = amountOut > tradeData.amountOutMin ? amountOut - tradeData.amountOutMin : 0;

            if (profit > bestProfit) {
                analysis.bestRouter = tradeData.routers[i];
                analysis.amount = amountOut;
                analysis.profit = profit;
                bestProfit = profit;
            }
        }
    }

    function executeTradeETHForTokens(
        address router,
        address token,
        uint256 amountIn,
        uint256 amountOutMin
    ) external payable onlyOwner {
        console.log("Executing trade ETH for Tokens");
        console.log("Router:", router);
        console.log("Token:", token);
        console.log("Amount in:", amountIn);
        console.log("Amount out min:", amountOutMin);
        console.log("Contract ETH balance:", address(this).balance);

        require(address(this).balance >= amountIn, "Insufficient contract ETH balance");

        address[] memory path = new address[](2);
        path[0] = address(0);
        path[1] = token;

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IRouter(router).swapExactETHForTokens{ value: amountIn }(amountOutMin, path, address(this), block.timestamp);
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));

        require(balanceAfter > balanceBefore, "Trade execution failed");

        _trades[token] = Trade(amountIn, balanceAfter - balanceBefore);
        console.log("Current _trades:", _trades[token].amountETH, _trades[token].amountToken);
    }

    function executeTradeTokensForETH(
        address router,
        address token,
        uint256 amountIn,
        uint256 amountOutMin
    ) external onlyOwner {
        console.log("Executing trade Tokens for ETH");
        console.log("Router:", router);
        console.log("Token:", token);
        console.log("Amount in:", amountIn);
        console.log("Amount out min:", amountOutMin);
        console.log("Contract token balance:", IERC20(token).balanceOf(address(this)));

        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = address(0);

        safeIncreaseAllowance(IERC20(token), router, amountIn);

        uint256 balanceBefore = address(this).balance;
        IRouter(router).swapExactTokensForETH(amountIn, amountOutMin, path, address(this), block.timestamp);
        uint256 balanceAfter = address(this).balance;

        require(balanceAfter > balanceBefore, "Trade execution failed");

        _trades[token] = Trade(balanceAfter - balanceBefore, amountIn);
        console.log("Current _trades:", _trades[token].amountETH, _trades[token].amountToken);
    }

    function getAmountOut(address router, address tokenIn, address tokenOut, uint256 amountIn) internal view returns (uint256) {
        address[] memory path;
        if (tokenIn == address(0)) {
            path = new address[](2);
            path[0] = address(0);
            path[1] = tokenOut;
        } else if (tokenOut == address(0)) {
            path = new address[](2);
            path[0] = tokenIn;
            path[1] = address(0);
        } else {
            path = new address[](3);
            path[0] = tokenIn;
            path[1] = address(0);
            path[2] = tokenOut;
        }

        uint256[] memory amounts = IRouter(router).getAmountsOut(amountIn, path);
        return amounts[amounts.length - 1];
    }

    function getBestRouterTokenToETH(address[] calldata routers, address token, uint256 amountIn) internal view returns (address, uint256) {
        address bestRouter;
        uint256 bestAmountOut;

        for (uint256 i = 0; i < routers.length; i++) {
            console.log ("i:", i);
            console.log("Router:", routers[i]);
            console.log("Token:", token);
            console.log("Amount in:", amountIn);

            uint256 amountOut = getAmountOut(routers[i], token, address(0), amountIn);
            if (amountOut > bestAmountOut) {
                console.log("Found better router:", routers[i]);
                bestRouter = routers[i];
                bestAmountOut = amountOut;
            }
        }

        console.log("Best router:", bestRouter);
        console.log("Best amount out:", bestAmountOut);

        return (bestRouter, bestAmountOut);
    }

    function getBestRouterETHToToken(address[] calldata routers, address token, uint256 amountIn) internal view returns (address, uint256) {
        address bestRouter;
        uint256 bestAmountOut;

        for (uint256 i = 0; i < routers.length; i++) {
            console.log ("i:", i);
            console.log("Router:", routers[i]);
            console.log("Token:", token);
            console.log("Amount in:", amountIn);
            uint256 amountOut = getAmountOut(routers[i], address(0), token, amountIn);

            if (amountOut > bestAmountOut) {
                console.log("Found better router:", routers[i]);
                bestRouter = routers[i];
                bestAmountOut = amountOut;
            }
        }

        console.log("Best router:", bestRouter);
        console.log("Best amount out:", bestAmountOut);

        return (bestRouter, bestAmountOut);
    }

    function getTrades(address token) external view onlyOwner returns (uint256, uint256) {
        return (_trades[token].amountETH, _trades[token].amountToken);
    }

    function getBalance(address token) external view onlyOwner returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function getETHBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function min(uint256 a, uint256 b) internal pure returns (uint256) {
        return a < b ? a : b;
    }

    receive() external payable {}
}