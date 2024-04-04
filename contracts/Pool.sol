// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import { IERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import { SafeERC20 } from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeERC20.sol";
import { IPoolAddressesProvider } from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import "hardhat/console.sol";

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