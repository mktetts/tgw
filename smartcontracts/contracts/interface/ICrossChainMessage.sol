// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Message} from "../library/Message.sol";

interface ICrossChainMessage {
    function getFee()
        external
        view
        returns (uint256);

    function CrossChainMessageSend(
        uint256 _tagetChainId,
        Message.MessageInfo calldata _message,
        uint256 _gasFees,
        uint256 value,
        address sender,
        uint256 gasPrice
    ) external payable returns (bytes32);
}
