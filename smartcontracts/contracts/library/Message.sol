// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

library Message {
    struct MessageInfo {
        address receiver;
        bytes data;
    }
}   