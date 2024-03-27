// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { FlashLoanSimpleReceiverBase } from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import { IPoolAddressesProvider } from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import { IERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";


interface IRouter {
   function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[2] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);
}

contract ArbitrageBot is FlashLoanSimpleReceiverBase, Ownable {
    using SafeERC20 for IERC20;

    address public immutable ROUTER0;
    address public immutable ROUTER1;

    event ArbitrageExecuted();
    event SwapExecuted(address indexed router, address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event FlashLoanReceived(address indexed asset, uint256 amount);
    event FlashLoanReturned(address indexed asset, uint256 amount, uint256 premium);


    constructor(address _addressProvider, address _router0, address _router1)
        FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider))
        Ownable(msg.sender)
    {
        ROUTER0 = _router0;
        ROUTER1 = _router1;
    }

    function executeSwap(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) internal {
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        safeIncreaseAllowance(IERC20(tokenIn), router, amountIn);
        IRouter(router).swapExactTokensForTokens(amountIn, amountOutMin, [tokenIn, tokenOut], address(this), block.timestamp);
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        require(balanceAfter > balanceBefore, "Swap failed");
        emit SwapExecuted(router, tokenIn, tokenOut, amountIn, balanceAfter - balanceBefore);
    }

    function safeIncreaseAllowance(IERC20 token, address spender, uint256 amountNeeded) internal {
        uint256 currentAllowance = token.allowance(address(this), spender);
        if(currentAllowance < amountNeeded) {
            token.safeApprove(spender, 0); 
            token.safeApprove(spender, amountNeeded); 
        }
    }

    /**
        This function is called after your contract has received the flash loaned amount
     */
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {        
        require(msg.sender == address(POOL), "FlashLoanError: Call must come from the Pool");
        require(initiator == address(this), "FlashLoanError: Initiator is not this contract");

        emit FlashLoanReceived(asset, amount);

        (address router0, address router1, address token0, address token1, uint256 amount0, uint256 amount1) = abi.decode(params, (address, address, address, address, uint256, uint256));

        require(router0 == ROUTER0 || router0 == ROUTER1, "SwapError: Invalid router0");
        require(router1 == ROUTER0 || router1 == ROUTER1, "SwapError: Invalid router1");
        require(router0 != router1, "SwapError: Routers must be different");

        executeSwap(router0, token0, token1, amount0, amount1);
        executeSwap(router1, token1, token0, IERC20(token1).balanceOf(address(this)), amount0 + premium);
      
        require(IERC20(asset).balanceOf(address(this)) >= amount + premium, "Insufficient balance to repay flash loan");
      
        safeIncreaseAllowance(IERC20(asset), address(POOL), amount + premium);

        emit FlashLoanReturned(asset, amount, premium);

        return true;
    }

    function executeArbitrage(
        address router0,
        address router1,
        address token0,
        address token1,
        uint256 amount0,
        uint256 amount1
    ) external onlyOwner {
        emit ArbitrageExecuted();

        require(router0 == ROUTER0 || router0 == ROUTER1, "InitError: Invalid router0");
        require(router1 == ROUTER0 || router1 == ROUTER1, "InitError: Invalid router1");
        require(router0 != router1, "InitError: Routers must be different");

        bytes memory params = abi.encode(router0, router1, token0, token1, amount0, amount1);

        POOL.flashLoanSimple(address(this), token0, amount0, params, 0);
    }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    receive() external payable {}

    fallback() external payable {}
}