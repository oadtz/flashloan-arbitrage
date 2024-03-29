// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { FlashLoanSimpleReceiverBase } from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import { IPoolAddressesProvider } from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import { IERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

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
    {}

    function executeSwap(address router, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOutMin) internal {
        address[] memory path = new address[](2);
        path[0] = tokenIn;
        path[1] = tokenOut;

        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));
        safeIncreaseAllowance(IERC20(tokenIn), router, amountIn);

        uint256 slippageTolerance = 5; // 5% slippage tolerance
        uint256 adjustedAmountOutMin = amountOutMin * (100 - slippageTolerance) / 100;

        IRouter(router).swapExactTokensForTokens(amountIn, adjustedAmountOutMin, path, address(this), block.timestamp);
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        require(balanceAfter > balanceBefore, "Swap failed");
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

        (address router0, address router1, address token0, address token1, uint256 amount0, uint256 amount1) = abi.decode(params, (address, address, address, address, uint256, uint256));

        require(router0 != router1, "SwapError: Routers must be different");

        executeSwap(router0, token0, token1, amount0, amount1);
        executeSwap(router1, token1, token0, IERC20(token1).balanceOf(address(this)), amount0 + premium);
      
        require(
            IERC20(asset).balanceOf(address(this)) >= amount + premium, 
            string(abi.encodePacked("Insufficient balance to repay flash loan. Balance: ", 
                uint2str(IERC20(asset).balanceOf(address(this))), 
                " Required: ", uint2str(amount + premium)))
        );
      
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
    ) public view returns (bool, uint256) {
        uint256 amountOut1 = getAmountOut(router0, token0, token1, amount0);
        uint256 amountOut2 = getAmountOut(router1, token1, token0, amountOut1);

        if (amountOut2 > amount0) {
            return (true, amountOut2);
        } else {
            return (false, 0);
        }
    }

    function executeArbitrage(
        address router0,
        address router1,
        address token0,
        address token1,
        uint256 amount0
    ) external onlyOwner {
        (bool arb, uint256 expectedAmountOut) = checkArbitrage(router0, router1, token0, token1, amount0);

        if (arb) {
            bytes memory params = abi.encode(router0, router1, token0, token1, amount0, expectedAmountOut);
            POOL.flashLoanSimple(address(this), token0, amount0, params, 0);
        }
    }

    function getBalance(address _tokenAddress) external view returns (uint256) {
        return IERC20(_tokenAddress).balanceOf(address(this));
    }

    function withdraw(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }
        
    function uint2str(uint256 _num) internal pure returns (string memory) {
        if (_num == 0) {
            return "0";
        }
        uint256 j = _num;
        uint256 len;
        while (j != 0) {
            len++;
            j /= 10;
        }
        bytes memory bstr = new bytes(len);
        uint256 k = len;
        while (_num != 0) {
            k = k - 1;
            uint8 temp = (48 + uint8(_num - _num / 10 * 10));
            bytes1 b1 = bytes1(temp);
            bstr[k] = b1;
            _num /= 10;
        }
        
        return string(bstr);
    }

    receive() external payable {}
}