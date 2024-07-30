// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

// Library to define the Game struct and associated fields
library GameLibrary {
    struct Game {
        bytes32 gameId;
        address gameOwner;
        string gameName;
        string nftName;
        string nftSymbol;
        uint256 price;
        string gameUrl;
        bytes32 gameAssets;
        uint256 timestamp;
    }
}