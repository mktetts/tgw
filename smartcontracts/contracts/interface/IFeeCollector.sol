// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IFeeCollector {
    // Function to withdraw all Ether from the contract (owner only)
    function deposit() external payable;

    // Function to get the contract's balance
    function getBalance() external view returns (uint256);
}
