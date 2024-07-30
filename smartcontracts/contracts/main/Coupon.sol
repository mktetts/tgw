// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interface/ICoupon.sol";

contract Coupon is ICoupon {
    address private admin;
    uint256 constant COUPON_VALIDITY_PERIOD = 96 hours;

    mapping(uint256 => uint256) public couponValue;
    mapping(address => Coupon[]) public coupons; // Store multiple coupons for each address
    uint256[] public thresholds; // Store all threshold values

    constructor() {
        admin = msg.sender;
        addCoupon(100000000000000, 50000000000000);
        addCoupon(1000000000000000, 500000000000000);
        addCoupon(10000000000000000, 5000000000000000);
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    function addCoupon(uint256 _value, uint256 _offer) public override onlyAdmin {
        if (couponValue[_value] == 0) {
            thresholds.push(_value);
        }
        couponValue[_value] = _offer;
    }

    function checkAndAssignCoupon(
        address contributor,
        uint256 totalContribution
    ) public override {
        uint256 highestCoupon = 0;
        for (uint256 i = 0; i < thresholds.length; i++) {
            uint256 threshold = thresholds[i];
            if (
                totalContribution >= threshold &&
                couponValue[threshold] > highestCoupon
            ) {
                highestCoupon = couponValue[threshold];
            }
        }
        if (highestCoupon > 0) {
            bytes32 uniqueId = generateUniqueId(
                contributor,
                highestCoupon,
                block.timestamp
            );
            coupons[contributor].push(
                Coupon({
                    id: uniqueId,
                    value: highestCoupon,
                    timestamp: block.timestamp + COUPON_VALIDITY_PERIOD,
                    used: false,
                    withdrawn: false
                })
            );
        }
    }

    function generateUniqueId(
        address contributor,
        uint256 value,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(contributor, value, timestamp));
    }

    function isCouponValid(address contributor, bytes32 couponId)
        public
        view
        override
        returns (bool)
    {
        Coupon[] memory userCoupons = coupons[contributor];
        for (uint256 i = 0; i < userCoupons.length; i++) {
            if (userCoupons[i].id == couponId) {
                return (block.timestamp <=
                    userCoupons[i].timestamp + COUPON_VALIDITY_PERIOD);
            }
        }
        return false;
    }

    function isCouponValidAndGetAmount(address contributor, bytes32 couponId)
        public
        view
        override
        returns (bool, uint256)
    {
        Coupon[] memory userCoupons = coupons[contributor];
        for (uint256 i = 0; i < userCoupons.length; i++) {
            if (userCoupons[i].id == couponId && !userCoupons[i].withdrawn) {
                return (
                    block.timestamp <=
                        userCoupons[i].timestamp + COUPON_VALIDITY_PERIOD,
                    userCoupons[i].value
                );
            }
        }
        return (false, 0);
    }

    function getMyCoupons(address contributor)
        public
        view
        override
        returns (Coupon[] memory)
    {
        return coupons[contributor];
    }

    function getThresholds() external view override returns (uint256[] memory) {
        return thresholds;
    }

    function transferCoupon(address originalOwner, address to, bytes32 couponId) external override {
        require(to != address(0), "Invalid recipient address");
        Coupon[] storage userCoupons = coupons[originalOwner];
        for (uint256 i = 0; i < userCoupons.length; i++) {
            if (userCoupons[i].id == couponId && !userCoupons[i].used && !userCoupons[i].withdrawn) {
                userCoupons[i].used = false;
                userCoupons[i].withdrawn = false;
                coupons[to].push(userCoupons[i]);
                userCoupons[i] = userCoupons[userCoupons.length - 1];
                userCoupons.pop();
                return;
            }
        }
        revert("Coupon not found or already used or withdrawn");
    }

    function markCouponAsWithdrawn(address contributor, bytes32 couponId) external override {
        Coupon[] storage userCoupons = coupons[contributor];
        for (uint256 i = 0; i < userCoupons.length; i++) {
            if (userCoupons[i].id == couponId && !userCoupons[i].withdrawn) {
                userCoupons[i].withdrawn = true;
                return;
            }
        }
        revert("Coupon not found or already withdrawn");
    }
}