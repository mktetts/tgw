// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interface/IFeeCollector.sol";

contract FeeCollector is IFeeCollector {
    // Address of the contract owner
    address private owner;
    address private eoa;
    // Event to log deposits
    event Deposit(address indexed user, uint256 amount);

    mapping(address => uint256) public refundedAmount;
    // Modifier to restrict functions to the contract owner
    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can call this function");
        _;
    }

    // Constructor sets the contract owner to the deployer
    constructor(address _eoa) {
        owner = msg.sender;
        eoa = _eoa;
    }

    // Function to deposit Ether into the contract
    function deposit() external payable override {
        require(msg.value > 0, "Deposit amount must be greater than zero");
        payable(eoa).transfer(msg.value);
        emit Deposit(msg.sender, msg.value);
    }

    function refundAmount() external {
        require(refundedAmount[msg.sender] > 0, "No Amount to refund");
        refundedAmount[msg.sender] = 0;
        payable(msg.sender).transfer(refundedAmount[msg.sender]);
    }

    receive() external payable {}

    // Function to add refund and deposit Ether to the contract
    function addRefund(address user) external payable onlyOwner {
        require(msg.value > 0, "Must send Ether to add refund");
        refundedAmount[user] += msg.value;
    }

    // Function to withdraw all Ether from the contract (owner only)
    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No Amount to withdraw");
        payable(owner).transfer(balance);
    }

    // Function to get the contract's balance
    function getBalance() external view returns (uint256) {
        return eoa.balance;
    }

    function getEOA() external view returns (address){
        return eoa;
    }
}
