// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;
import {Message} from "../library/Message.sol";

contract OffChain {
    function crossChainMessageReceive(Message.MessageInfo calldata message)
        external
    {
        (bool success, ) = (message.receiver).call(message.data);
        require(success, "Call to receiver failed");
    }

    function crossChainMessageReceiveWithAmount(
        Message.MessageInfo calldata message
    ) external payable {
        (bool success, ) = (message.receiver).call{value: msg.value}(
            message.data
        );
        require(success, "Call to receiver failed");
    }
}
