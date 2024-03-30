// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol";
import { IPoolAddressesProvider } from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "hardhat/console.sol";

contract Router {
    using SafeERC20 for IERC20;

    event TokensSwapped(address indexed tokenIn, address indexed tokenOut, uint256 amountIn, uint256 amountOut);
    event TokensDeposited(address indexed token, uint256 amount);

    function getAmountsOut(uint256 amountIn, address[] memory path) public view returns (uint256[] memory amounts) {
        require(path.length >= 2, "Router: invalid path");
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        for (uint256 i = 1; i < path.length; i++) {
            // Simulate price variation by multiplying the previous amount by a random factor
            uint256 priceFactor = (uint256(keccak256(abi.encodePacked(block.timestamp, i))) % 100) + 90;
            amounts[i] = (amounts[i - 1] * priceFactor) / 100;
        }
    }

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        // amounts = getAmountsOut(amountIn, path); // Ready check from the previous call
        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[1] = amountOutMin;

        console.log("Router: Swapping tokens");
        console.log("Router: Token In:", path[0]);
        console.log("Router: Token Out:", path[path.length - 1]);
        console.log("Router: Amount In:", amountIn);
        console.log("Router: Amount Out min:", amountOutMin);

        require(deadline >= block.timestamp, "Router: expired deadline");
        
        // Calculate the minimum output amount based on the price variation
        // uint256 minOutputAmount = (amountOutMin * 90) / 100; // Adjust the tolerance as needed
        
        // require(amounts[amounts.length - 1] >= minOutputAmount, "Router: insufficient output amount");
        console.log("Router: Transfering tokens to the router");
        IERC20(path[0]).safeTransferFrom(msg.sender, address(this), amountIn); // Router pulls the tokens from the arbiter
        //_swap(amounts, path, to);
        console.log("Router: Transfering tokens to the recipient");
        IERC20(path[path.length - 1]).safeTransfer(to, amountOutMin);

        emit TokensSwapped(path[0], path[path.length - 1], amountIn, amounts[amounts.length - 1]);
    }

    function _swap(uint256[] memory amounts, address[] memory path, address _to) internal {
        console.log("Router: _swap");
        for (uint256 i = 0; i < path.length - 1; i++) {
            IERC20(path[i]).safeTransfer(address(this), amounts[i]);
            IERC20(path[i]).safeTransfer(_to, amounts[i]);
        }
        IERC20(path[path.length - 1]).safeTransfer(_to, amounts[amounts.length - 1]);
    }

    function depositToken(address token, uint256 amount) external {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(token, amount);
    }
}

contract Token is IERC20 {
    string public name;
    string public symbol;
    uint8 public decimals;
    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _totalSupply
    ) {
        name = _name;
        symbol = _symbol;
        decimals = _decimals;
        totalSupply = _totalSupply;
        balanceOf[msg.sender] = _totalSupply;
    }

    function transfer(address recipient, uint256 amount) external returns (bool) {
        console.log("Token: Transfer", address(this));
        console.log("Token: Sender:", msg.sender);
        console.log("Token: Sender Balance:", balanceOf[msg.sender]);
        console.log("Token: Recipient:", recipient);
        console.log("Token: Recipient Balance:", balanceOf[recipient]);
        console.log("Token: Amount:", amount);
        require(balanceOf[msg.sender] >= amount, "Insufficient balance of sender");
        balanceOf[msg.sender] -= amount;
        balanceOf[recipient] += amount;
        emit Transfer(msg.sender, recipient, amount);
        return true;
    }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        emit Approval(msg.sender, spender, amount);
        return true;
    }

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool) {
        console.log("Token: Transfer from", address(this));
        console.log("Token: Sender:", sender);
        console.log("Token: Sender Balance:", balanceOf[sender]);
        console.log("Token: Recipient:", recipient);
        console.log("Token: Recipient Balance:", balanceOf[recipient]);
        console.log("Token: Amount:", amount);
        require(balanceOf[sender] >= amount, "Insufficient balance of sender");
        require(allowance[sender][msg.sender] >= amount, "Insufficient allowance of sender");
        balanceOf[sender] -= amount;
        balanceOf[recipient] += amount;
        allowance[sender][msg.sender] -= amount;
        emit Transfer(sender, recipient, amount);
        return true;
    }
}

interface IFlashLoanReceiver {
    function executeOperation(
        address asset,
        uint256 assetm,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool);
}

contract Pool {
    using SafeERC20 for IERC20;

    event FlashLoanExecuted(address indexed receiver, address indexed asset, uint256 amount);
    event TokensDeposited(address indexed token, uint256 amount);

    function getPool() external view returns (address) {
        return address(this);
    }

    function flashLoanSimple(
        address receiverAddress,
        address asset,
        uint256 amount,
        bytes calldata params,
        uint16 referralCode
    ) external {

        console.log("Pool: Flash loan requested");
        console.log("Pool: Receiver:", receiverAddress);
        console.log("Pool: Asset (Token 0):", asset);
        console.log("Pool: Amount Requested (Amount In):", amount);
        console.log("Pool: Referral code:", referralCode);
        uint256 balanceBefore = IERC20(asset).balanceOf(address(this));
        require (balanceBefore >= amount, "Insufficient balance for flash loan");

        console.log("Pool: Transferring tokens to receiver contract", receiverAddress);
        console.log("Pool: Asset (Token 0):", asset);
        console.log("Pool: Amount on Loan (Amount In):", amount);
        IERC20(asset).safeTransfer(receiverAddress, amount);

        console.log("Pool: Calling receiver.executeOperation()");
        bool success = IFlashLoanReceiver(receiverAddress).executeOperation(asset, amount, 0, receiverAddress, params);
   
        require (success, "Flash loan execution failed");

        IERC20(asset).safeTransferFrom(receiverAddress, address(this), amount);

        uint256 balanceAfter = IERC20(asset).balanceOf(address(this));
        require (balanceAfter >= balanceBefore, "Flash loan not repaid");

        emit FlashLoanExecuted(receiverAddress, asset, amount);
        console.log("Pool: Flash loan executed");
    }

    function depositToken(address token, uint256 amount) external {
        console.log("Pool: Depositing tokens");
        console.log("Pool: Token 0:", token);
        console.log("Pool: Amount:", amount);
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        emit TokensDeposited(token, amount);
    }
}