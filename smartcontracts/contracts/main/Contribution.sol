// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interface/ICoupon.sol";

contract Contribution {
    address private admin;
    ICoupon private couponContract;
    uint256 public nonce;
    struct ContributionDetails {
        address contributor;
        uint256 value;
        uint256 timestamp;
    }

    ContributionDetails[] public allContributions;
    uint256 public overAllContribution;
    mapping(address => uint256) public contributions;

    constructor(address _couponContract) {
        admin = msg.sender;
        couponContract = ICoupon(_couponContract);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

     function addContribution() external payable {
        require(msg.value > 0, "Amount should be greater than zero");
        contributions[msg.sender] += msg.value;
        overAllContribution += msg.value;
        nonce++;

        allContributions.push(
            ContributionDetails({
                contributor: msg.sender,
                value: msg.value,
                timestamp: block.timestamp
            })
        );

        couponContract.checkAndAssignCoupon(msg.sender, contributions[msg.sender]);


        if (nonce % 3 == 0) {
            uint256 paymentAmount = (address(this).balance * 60) / 100;
            payable(admin).transfer(paymentAmount);
        }
    }

    function getMyContribution(address contributor)
        public
        view
        returns (uint256)
    {
        return contributions[contributor];
    }

    function getOverAllContribution() public view returns (uint256) {
        return overAllContribution;
    }

    function getAllContributions()
        public
        view
        returns (ContributionDetails[] memory)
    {
        return allContributions;
    }

    function withdrawFunds(uint256 amount) external onlyAdmin {
        require(amount <= address(this).balance, "Insufficient contract balance");
        payable(admin).transfer(amount);
    }

    // function withdrawContribution() external {
    //     uint256 amount = contributions[msg.sender];
    //     require(amount > 0, "No contributions to withdraw");
    //     contributions[msg.sender] = 0;
    //     overAllContribution -= amount;
    //     payable(msg.sender).transfer(amount);
    // }


    function withdrawCouponValue(bytes32 couponId) external {
        (bool valid, uint256 value) = couponContract.isCouponValidAndGetAmount(msg.sender, couponId);
        require(valid, "Coupon not valid or already withdrawn");
        require(value > 0, "Coupon has no value");
        couponContract.markCouponAsWithdrawn(msg.sender, couponId);
        payable(msg.sender).transfer(value);
    }

    function getBalance() external view returns(uint256){
        return address(this).balance;
    }
}
