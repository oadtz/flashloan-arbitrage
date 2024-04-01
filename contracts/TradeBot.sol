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
        uint256 gasLimit
    ) external view returns (string memory direction, address bestRouter, uint256 amountETH, uint256 amountToken) {
        uint256 currentETHBalance = address(this).balance;
        uint256 currentTokenBalance = IERC20(token).balanceOf(address(this));

        // Early exit if no balances
        if (currentETHBalance == 0 && currentTokenBalance == 0) {
            console.log("No balance for ETH and token");
            return ("none", address(0), 0, 0);
        }

        Trade memory lastTrade = _trades[token];
        uint256 baseAmountETH = lastTrade.amountETH > 0 ? lastTrade.amountETH : currentETHBalance;
        uint256 baseAmountToken = lastTrade.amountToken > 0 ? lastTrade.amountToken : currentTokenBalance;

        // Analyze the best trade for ETH to Token and Token to ETH
        TradeAnalysis memory ethToToken = getBestTradeAnalysis(routers, address(0), token, baseAmountETH);
        TradeAnalysis memory tokenToETH = getBestTradeAnalysis(routers, token, address(0), baseAmountToken);

        // Determine direction based on profit and gas cost
        if (tokenToETH.profit > ethToToken.profit && tokenToETH.profit > gasLimit) {
            return ("buy", tokenToETH.bestRouter, 0, tokenToETH.amount);
        } else if (ethToToken.profit > tokenToETH.profit && ethToToken.profit > gasLimit) {
            return ("sell", ethToToken.bestRouter, ethToToken.amount, 0);
        } else {
            return ("none", address(0), 0, 0);
        }
    }

    function getBestTradeAnalysis(
        address[] calldata routers,
        address tokenIn,
        address tokenOut,
        uint256 baseAmount
    ) internal view returns (TradeAnalysis memory analysis) {
        uint256 bestProfit = 0;

        for (uint256 i = 0; i < routers.length; i++) {
            uint256 amountOut = getAmountOut(routers[i], tokenIn, tokenOut, baseAmount);
            uint256 profit = amountOut > baseAmount ? amountOut - baseAmount : 0;

            if (profit > bestProfit) {
                analysis.bestRouter = routers[i];
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
        require(msg.value == amountIn, "Incorrect ETH amount sent");

        address[] memory path = new address[](2);
        path[0] = address(0);
        path[1] = token;

        uint256 balanceBefore = IERC20(token).balanceOf(address(this));
        IRouter(router).swapExactETHForTokens{ value: amountIn }(amountOutMin, path, address(this), block.timestamp);
        uint256 balanceAfter = IERC20(token).balanceOf(address(this));

        require(balanceAfter > balanceBefore, "Trade execution failed");

        _trades[token] = Trade(amountIn, balanceAfter - balanceBefore);
    }

    function executeTradeTokensForETH(
        address router,
        address token,
        uint256 amountIn,
        uint256 amountOutMin
    ) external onlyOwner {
        address[] memory path = new address[](2);
        path[0] = token;
        path[1] = address(0);

        safeIncreaseAllowance(IERC20(token), router, amountIn);

        uint256 balanceBefore = address(this).balance;
        IRouter(router).swapExactTokensForETH(amountIn, amountOutMin, path, address(this), block.timestamp);
        uint256 balanceAfter = address(this).balance;

        require(balanceAfter > balanceBefore, "Trade execution failed");

        _trades[token] = Trade(balanceAfter - balanceBefore, amountIn);
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
            // console.log ("i:", i);
            // console.log("Router:", routers[i]);
            // console.log("Token:", token);
            // console.log("Amount in:", amountIn);
            uint256 amountOut = getAmountOut(routers[i], address(0), token, amountIn);

            if (amountOut > bestAmountOut) {
                // console.log("Found better router:", routers[i]);
                bestRouter = routers[i];
                bestAmountOut = amountOut;
            }
        }

        // console.log("Best router:", bestRouter);
        // console.log("Best amount out:", bestAmountOut);

        return (bestRouter, bestAmountOut);
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

    receive() external payable {}
}