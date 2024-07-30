// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interface/ICrossChainMessage.sol";
import {Message} from "../library/Message.sol";
import "../interface/IFeeCollector.sol";

contract OnChain is ICrossChainMessage {
    address private admin;
    IFeeCollector private feeCollector;
    uint256 private gas_limit = 21000; // not yet used
    uint256 private dest_gas_per_payload_byte = 10; // not yet used
    uint256 private relayer_fee = 100000000000000; // wei
    uint256 private executionGasPrice = 20000000000; // not yet used

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can call this function");
        _;
    }

    constructor(address _feeCollectorAddress) {
        feeCollector = IFeeCollector(_feeCollectorAddress);
        admin = msg.sender;
    }

    function updateGasLimit(uint256 _gasLimit) external onlyAdmin {
        gas_limit = _gasLimit;
    }

    function updateDestGasPerPayloadByte(uint256 _destGasPerPayloadByte)
        external
        onlyAdmin
    {
        dest_gas_per_payload_byte = _destGasPerPayloadByte;
    }

    function updateRelayerFee(uint256 _relayerFee) external onlyAdmin {
        relayer_fee = _relayerFee;
    }

    function getGasLimit() internal view returns (uint256) {
        return gas_limit;
    }

    function getDestGasPerPayloadByte() internal view returns (uint256) {
        return dest_gas_per_payload_byte;
    }

    function getRelayerFee() internal view returns (uint256) {
        return relayer_fee;
    }

    event CrossChainMessageInitiated(
        bytes32 messageHash,
        uint256 targetChainId,
        Message.MessageInfo message,
        uint256 networkFee,
        uint256 value,
        address sender,
        uint256 gasPrice
    );

    function CrossChainMessageSend(
        uint256 _targetChainId,
        Message.MessageInfo calldata _message,
        uint256 networkFee,
        uint256 value,
        address sender,
        uint256 gasPrice
    ) external payable override returns (bytes32) {
        bytes memory encodedMessage = abi.encodePacked(
            block.timestamp,
            _message.receiver,
            _message.data
        );
        feeCollector.deposit{value: msg.value}();
        bytes32 messageHash = keccak256(encodedMessage);
        emit CrossChainMessageInitiated(
            messageHash,
            _targetChainId,
            _message,
            networkFee,
            value,
            sender,
            gasPrice
        );
        return messageHash;
    }

    function getFee() external view override returns (uint256 fee) {
        // uint256 executionCost = executionGasPrice *
        //     (gas_limit + (message.length * dest_gas_per_payload_byte));

        return relayer_fee;
    }
}
