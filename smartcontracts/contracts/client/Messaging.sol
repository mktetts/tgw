// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "../interface/ICrossChainMessage.sol";
import {Message} from "../library/Message.sol";
import {GameLibrary} from "../library/Game.sol";
import {NFT} from "./NFT.sol";
import {Games} from "./Games.sol";

contract Messaging {
    ICrossChainMessage private onChainContract;
    NFT nft;
    Games games;

    constructor(
        address _onChainContract,
        address _nftAddress,
        address _gameAddress
    ) {
        onChainContract = ICrossChainMessage(_onChainContract);
        nft = NFT(_nftAddress);
        games = Games(_gameAddress);
    }

    function mintNFT(
        uint64 _targetChainId,
        address _receiverAddress,
        bytes32 gameId,
        address to,
        bytes32 storekey,
        uint256 price,
        uint256 gasPrice
    ) external payable returns (bytes32) {
        bytes memory message = abi.encodeWithSelector(
            nft.mint.selector,
            to,
            gameId,
            storekey,
            price
        );

        bytes32 messageHash = sendMessage(
            _targetChainId,
            _receiverAddress,
            message,
            msg.value,
            0,
            msg.sender,
            gasPrice
        );
        return messageHash;
    }

    function buyNFT(
        uint64 _targetChainId,
        address _receiverAddress,
        bytes32 gameId,
        uint256 tokenId,
        address buyer,
        uint256 nftPrice,
        uint256 gasPrice
    ) external payable returns (bytes32) {
        bytes memory message = abi.encodeWithSelector(
            nft.buyToken.selector,
            gameId,
            tokenId,
            buyer
        );
        // require(msg.value >= nftPrice, "Pay the required game price");
        bytes32 messageHash = sendMessage(
            _targetChainId,
            _receiverAddress,
            message,
            msg.value,
            nftPrice,
            msg.sender,
            gasPrice
        );
        return messageHash;
    }

    function teleportNFT(
        uint64 _targetChainId,
        address _receiverAddress,
        bytes32 gameId,
        uint256 tokenId,
        address to,
        uint256 price,
        uint256 gasPrice
    ) external payable returns (bytes32) {
        (bool success, bytes32 storekey) = nft.burn(
            gameId,
            tokenId,
            msg.sender
        );
        require(success, "Burning the token failed");

        bytes memory message = abi.encodeWithSelector(
            nft.mint.selector,
            to,
            gameId,
            storekey,
            price
        );

        bytes32 messageHash = sendMessage(
            _targetChainId,
            _receiverAddress,
            message,
            msg.value,
            0,
            msg.sender,
            gasPrice
        );
        return messageHash;
    }

    function createGame(
        uint64 _targetChainId,
        address _receiverAddress,
        GameLibrary.Game memory newGame,
        uint256 gasPrice
    ) external payable returns (bytes32) {
        bytes memory message = abi.encodeWithSelector(
            games.addGame.selector,
            newGame
        );

        bytes32 messageHash = sendMessage(
            _targetChainId,
            _receiverAddress,
            message,
            msg.value,
            0,
            msg.sender,
            gasPrice
        );
        return messageHash;
    }

    function buyGame(
        uint64 _targetChainId,
        address _receiverAddress,
        bytes32 gameId,
        address buyer,
        uint256 gamePrice,
        uint256 gasPrice
    ) external payable returns (bytes32) {
        bytes memory message = abi.encodeWithSelector(
            games.buyGame.selector,
            gameId,
            buyer
        );
        // require(msg.value >= gamePrice, "Pay the required game price");
        bytes32 messageHash = sendMessage(
            _targetChainId,
            _receiverAddress,
            message,
            msg.value,
            gamePrice,
            msg.sender,
            gasPrice
        );
        return messageHash;
    }

    function sendMessage(
        uint64 _targetChainId,
        address _receiverAddress,
        bytes memory _data,
        uint256 networkfees,
        uint256 value,
        address sender,
        uint256 gasPrice
    ) internal returns (bytes32) {
        Message.MessageInfo memory message = Message.MessageInfo({
            receiver: _receiverAddress,
            data: _data
        });
        uint256 networkFee = onChainContract.getFee();
        require(networkFee <= networkfees, "Pay the correct netwrok fee");
        bytes32 messageHash = onChainContract.CrossChainMessageSend{
            value: networkfees
        }(_targetChainId, message, networkfees, value, sender, gasPrice);
        return messageHash;
    }

    function getFee() external view returns (uint256) {
        return onChainContract.getFee();
    }
}
