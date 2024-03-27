// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Import necessary Aave and ERC20 interfaces
import "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ArbitrageBot is FlashLoanSimpleReceiverBase {
    using SafeMath for uint;

    // Event to log asset and balance
    event Log(address asset, uint val);

    constructor(address provider) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(provider)) {}

    // Function to initiate a flash loan
    function createFlashLoan(address asset, uint amount) external {
        address receiver = address(this);
        bytes memory params = "";
        uint16 referralCode = 0;

        // Log the asset and its balance before the flash loan
        emit Log(asset, IERC20(asset).balanceOf(address(this)));

        // Initiate the flash loan
        POOL.flashLoanSimple(
            receiver,
            asset,
            amount,
            params,
            referralCode
        );
    }

    // Function called by Aave after a flash loan is initiated
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external returns (bool) {

        // 👇 Your custom logic for the flash loan should be implemented here 👇
        require(initiator == address(this), "Initiator is not this contract");
        
        // This is where you can implement your custom logic for the flash loan.
        // You can use 'asset' to identify the token being borrowed, 'amount' for the borrowed amount,
        // and 'premium' for the premium fee.
        
        // Example: 
        // 1. Use 'asset' and 'amount' to perform some operations
        // 2. Make sure to repay the flash loan by transferring 'amount' + 'premium' back to Aave
        // 3. You can also use 'params' to pass additional data if needed.
        (uint256 amount1) = abi.decode(params, (uint256));

        // 👆 Your custom logic for the flash loan should be implemented above here 👆

        // Log the asset and its balance after the flash loan
        emit Log(asset, IERC20(asset).balanceOf(address(this)));

        // Calculate the total amount owing (amount borrowed + premium)
        uint amountOwing = amount.add(premium).add(amount1);

        // Approve Aave to transfer the amount owing from this contract
        IERC20(asset).approve(address(POOL), amountOwing);

        return true;
    }
}