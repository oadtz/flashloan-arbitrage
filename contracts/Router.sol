// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
// import "hardhat/console.sol";

contract Router is Ownable {
    using SafeERC20 for IERC20;

    event TokensSwapped(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event TokensDeposited(address indexed token, uint256 amount);
    event ETHForTokensSwapped(address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event TokensForETHSwapped(address indexed tokenIn, uint256 amountIn, uint256 amountOut);


    constructor() Ownable(msg.sender) {}

    function WETH() external pure returns (address) {
        return address(0);
    }

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Router: invalid path");
        require(path[0] != path[path.length - 1], "Router: identical tokens");
        require(path[0] != address(0) && path[path.length - 1] != address(0), "Router: ZERO_ADDRESS");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;

        for (uint256 i = 1; i < path.length; i++) {
            address tokenOut = path[i];
            uint256 routerBalance;

            if (tokenOut == address(0)) {
                // If the output token is the native coin (address(0)), use the contract's balance
                routerBalance = address(this).balance;
            } else {
                // If the output token is an ERC20 token, use the IERC20 balanceOf function
                routerBalance = IERC20(tokenOut).balanceOf(address(this));
            }
            // console.log("Router: Balance:", routerBalance);
            // console.log("Router: Token Out:", tokenOut);

            if (routerBalance == 0) {
                // If the router has no balance of the output token, return 0
                amounts[i] = 0;
            } else {
                // Generate a random amount out between 1 and the router's balance
                uint256 randomAmount;
                if (tokenOut == address(0)) {
                    // If the output token is WETH, generate a random amount between 1 and 10
                    uint256 minAmount = 1e18; // 1 WETH
                    uint256 maxAmount = 10e18; // 10 WETH
                    randomAmount = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % (maxAmount - minAmount + 1)) + minAmount;
                } else {
                    // For other tokens, generate a random amount between 1 and the router's balance
                    randomAmount = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % routerBalance) + 1;
                }
                amounts[i] = randomAmount;
            }
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(IERC20(path[path.length - 1]).balanceOf(address(this)) >= amountOutMin, "Router: insufficient output amount");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[1] = amountOutMin;

        // console.log("Router: Swapping tokens");
        // console.log("Router: Token In:", path[0]);
        // console.log("Router: Token Out:", path[path.length - 1]);
        // console.log("Router: Amount In:", amountIn);
        // console.log("Router: Amount Out min:", amountOutMin);

        require(deadline >= block.timestamp, "Router: expired deadline");
        
        // console.log("Router: Transfering tokens to the router");
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amounts[0]); // Router pulls the tokens from the arbiter
        
        // console.log("Router: Transfering tokens to the recipient");
        IERC20(path[path.length - 1]).safeTransfer(to, amounts[amounts.length - 1]);

        emit TokensSwapped(path[0], path[path.length - 1], amounts[0], amounts[amounts.length - 1]);
    }
    
    function swapExactETHForTokens(
        uint256 amountOutMin, 
        address[] calldata path, 
        address to, 
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        // console.log("Router: Swapping ETH for tokens");
        require(msg.value > 0, "Router: Must send ETH to swap");
        require(deadline >= block.timestamp, "Router: expired deadline");
        require(IERC20(path[path.length - 1]).balanceOf(address(this)) >= amountOutMin, "Router: insufficient output amount");
        amounts = new uint256[](path.length);
        amounts[0] = msg.value;
        amounts[1] = amountOutMin;

        // Simulate transferring the tokens to the recipient
        // console.log("Router: Transfering tokens to the recipient");
        IERC20(path[path.length - 1]).safeTransfer(to, amounts[amounts.length - 1]);

        // Here we're simply emitting an event for simulation purposes
        emit ETHForTokensSwapped(path[path.length - 1], amounts[0], amounts[amounts.length - 1]);
    }

    // Simulate swapping Tokens for ETH
    function swapExactTokensForETH(
        uint256 amountIn, 
        uint256 amountOutMin, 
        address[] calldata path, 
        address to, 
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // console.log("Router: Swapping tokens for ETH");
        require(amountIn > 0, "Router: Must send tokens to swap");
        require(deadline >= block.timestamp, "Router: expired deadline");
        // Simulate the exchange rate and calculate the amount of ETH to be received
        require(address(this).balance >= amountOutMin, "Router: insufficient output amount");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[1] = amountOutMin;

        // Simulate pulling the tokens from the sender
        // console.log("Router: Transfering tokens to the router");
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn); // Router pulls the tokens from the caller
        
        // Simulate transferring ETH to the recipient
        // console.log("Router: Transfering ETH to the recipient");
        payable(to).transfer(amountOutMin);

        // Here we're simply emitting an event for simulation purposes
        emit TokensForETHSwapped(path[0], amountIn, amounts[amounts.length - 1]);
    }

    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        // console.log("Router: _swap");
        for (uint256 i = 0; i < path.length - 1; i++) {
            IERC20(path[i]).safeTransfer(address(this), amounts[i]);
            IERC20(path[i]).safeTransfer(_to, amounts[i]);
        }
        IERC20(path[path.length - 1]).safeTransfer(_to, amounts[amounts.length - 1]);
    }

    function depositETH() external payable {
        emit TokensDeposited(address(0), msg.value);
    }

    function depositToken(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(token, amount);
    }

    function withdrawETH() external onlyOwner {
        uint256 balance = address(this).balance;
        payable(owner()).transfer(balance);
    }

    function withdrawToken(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).safeTransfer(owner(), balance);
    }

    receive() external payable {}
}