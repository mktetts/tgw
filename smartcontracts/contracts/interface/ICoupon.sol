// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface ICoupon {
    struct Coupon {
        bytes32 id;
        uint256 value;
        uint256 timestamp;
        bool used;
        bool withdrawn;
    }

    function addCoupon(uint256 _value, uint256 _offer) external;

    function isCouponValid(address contributor, bytes32 couponId) external view returns (bool);

    function getMyCoupons(address contributor) external view returns (Coupon[] memory);

    function getThresholds() external view returns (uint256[] memory);

    function transferCoupon(address originalOwner, address to, bytes32 couponId) external;

    function checkAndAssignCoupon(address contributor, uint256 totalContribution) external;

    function isCouponValidAndGetAmount(address contributor, bytes32 couponId) external view returns (bool, uint256);

    function markCouponAsWithdrawn(address contributor, bytes32 couponId) external;
}