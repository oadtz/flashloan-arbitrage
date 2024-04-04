// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";


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