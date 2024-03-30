// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { FlashLoanSimpleReceiverBase } from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import { IPoolAddressesProvider } from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import { IERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

interface IRouter {
    function getAmountsOut(uint256 amountIn, address[] calldata path) external view returns (uint256[] memory amounts);
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract ArbitrageBot is FlashLoanSimpleReceiverBase, Ownable {
    using SafeERC20 for IERC20;

    constructor(address _addressProvider)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
        Ownable(msg.sender)
    {
        // console.log("ArbitrageBot deployed");
    }

    function executeSwap(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) internal {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        safeIncreaseAllowance(IERC20(tokenIn), router, amountIn);

        // console.log("Executing swap on router:", router);
        // console.log("Token In:", tokenIn);
        // console.log("Token Out:", tokenOut);
        // console.log("Amount in:", amountIn);
        // console.log("Minimum amount out:",  amountOutMin);

        IRouter(router).swapExactTokensForTokens(amountIn,  amountOutMin, path, address(this), block.timestamp);

        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));

        require(balanceAfter > balanceBefore, "Swap failed because of insufficient output amount");

        // console.log("Swap executed successfully");
        // console.log("Balance before:", balanceBefore);
        // console.log("Balance after:", balanceAfter);
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 amountNeeded) internal {
        uint256 currentAllowance = token.allowance(address(this), spender);
        if(currentAllowance < amountNeeded) {
            token.safeApprove(spender, 0);
            token.safeApprove(spender, amountNeeded);
        }
    }

    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        require(msg.sender == address(POOL), "FlashLoanError: Call must come from the Pool");
        require(initiator == address(this), "FlashLoanError: Initiator is not this contract");

        (address router0, address router1, address token0, address token1, uint256 amount0, uint256 expectedAmountOut) = abi.decode(params, (address, address, address, address, uint256, uint256));

        require(router0 != router1, "SwapError: Routers must be different");

        // console.log("Executing flash loan arbitrage");
        // console.log("Router 0:", router0);
        // console.log("Router 1:", router1);
        // console.log("Token 0:", token0);
        // console.log("Token 1:", token1);
        // console.log("Flash loan amount (Token 0):", amount);
        // console.log("Expected amount out (Token 0):", expectedAmountOut);
        // console.log("Current balance after getting loan (Token 0):", IERC20(asset).balanceOf(address(this)));

        // console.log("Executing swap on router 0 (Token 0 -> Token 1)");
        executeSwap(router0, token0, token1, amount0, 1);
        // console.log("Executing swap on router 1 (Token 0 <- Token 1)");
        executeSwap(router1, token1, token0, IERC20(token1).balanceOf(address(this)), expectedAmountOut);

        // console.log("Balance after arbitrage:", IERC20(asset).balanceOf(address(this)));
        // console.log("Required balance to repay flash loan:", amount + premium);
        
        require(IERC20(asset).balanceOf(address(this)) >= (amount + premium), "Insufficient balance to repay flash loan");

        safeIncreaseAllowance(IERC20(asset), address(POOL), amount + premium);

        return true;
    }

    function getAmountOut(
        address router,
        address tokenIn,
        address tokenOut,
        uint256 amountIn
    ) internal view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256[] memory amounts = IRouter(router).getAmountsOut(amountIn, path);
        return amounts[1];
    }

    function checkArbitrage(
        address router0,
        address router1,
        address token0,
        address token1,
        uint256 amount0
    ) public view returns (uint256) {
        uint256 amountOut1 = getAmountOut(router0, token0, token1, amount0);
        uint256 amountOut2 = getAmountOut(router1, token1, token0, amountOut1);

        // console.log("Checking arbitrage opportunity");
        // console.log("Router 0:", router0);
        // console.log("Router 1:", router1);
        // console.log("Token 0:", token0);
        // console.log("Token 1:", token1);
        // console.log("Amount in:", amount0);
        // console.log("Token 0 Amount out (Router 0 -> Router 1):", amountOut1);
        // console.log("Token 1 Amount out (Router 0 <- Router 1):", amountOut2);

        if (amountOut2 > amount0) {
            // console.log("Arbitrage opportunity found");
            // console.log("Expected profit:", amountOut2 - amount0);
            return amountOut2;
        } else {
            // console.log("No arbitrage opportunity found");
            return 0;
        }
    }

    function executeArbitrage(
        address router0,
        address router1,
        address token0,
        address token1,
        uint256 amountIn,
        uint256 expectedAmountOut
    ) external onlyOwner {
        uint256 amountOut = checkArbitrage(router0, router1, token0, token1, amountIn);

        require(amountOut > (expectedAmountOut - amountIn), "Arbitrage: No opportunity found");

        bytes memory params = abi.encode(router0, router1, token0, token1, amountIn, expectedAmountOut);
        POOL.flashLoanSimple(address(this), token0, amountIn, params, 0);
    }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function withdraw(address token) external onlyOwner {
        // console.log("Withdrawn:", IERC20(token).balanceOf(address(this)));
        IERC20(token).safeTransfer(owner(), IERC20(token).balanceOf(address(this)));
    }

    receive() external payable {}
}