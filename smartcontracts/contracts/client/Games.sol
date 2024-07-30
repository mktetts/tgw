// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {GameLibrary} from "../library/Game.sol";

contract Games {
    bytes32[] public gameIds;
    // Mapping to store games with a unique identifier
    mapping(bytes32 => GameLibrary.Game) public games;

    // Mapping to track which users have purchased which games
    mapping(bytes32 => mapping(address => bool)) public gamePurchasers;

    // Event to log the addition of a new game
    event GameAdded(bytes32 gameId, string gameName, address gameOwner);

    // Event to log the purchase of a game
    event GamePurchased(bytes32 gameId, address buyer);

    // Function to add a new game
    function addGame(GameLibrary.Game memory newGame) public {
        // bytes32 gameId = keccak256(
        //     abi.encodePacked(
        //         newGame.gameName,
        //         newGame.gameOwner,
        //         block.timestamp
        //     )
        // );
        // newGame.gameId = gameId; // Keep the gameId as bytes32
        newGame.timestamp = block.timestamp;
        games[newGame.gameId] = newGame;
        gameIds.push(newGame.gameId);
        emit GameAdded(newGame.gameId, newGame.gameName, newGame.gameOwner);
    }
    function getGameId(uint256 nonce) external view returns (bytes32){
        return keccak256(
            abi.encodePacked(
                msg.sender,
                nonce
            )
        );
    }
    // Function to get all games
    function getAllGames() external view returns (GameLibrary.Game[] memory) {
        GameLibrary.Game[] memory allGames = new GameLibrary.Game[](
            gameIds.length
        );
        for (uint256 i = 0; i < gameIds.length; i++) {
            allGames[i] = games[gameIds[i]];
        }
        return allGames;
    }

    // Function to buy a game
    function buyGame(bytes32 gameId, address buyer) public payable {
        require(games[gameId].gameId != bytes32(0), "Invalid game ID");
        GameLibrary.Game storage game = games[gameId];
        require(msg.value == game.price, "Incorrect value sent");
        require(
            !gamePurchasers[gameId][buyer],
            "Game already purchased by this address"
        );

        gamePurchasers[gameId][buyer] = true;

        // Transfer the price to the game owner
        payable(game.gameOwner).transfer(msg.value);

        emit GamePurchased(gameId, buyer);
    }

    function hasPurchased(bytes32 gameId, address buyer)
        external
        view
        returns (bool)
    {
        return gamePurchasers[gameId][buyer];
    }

    // Function to get all purchased games for a user
    function getPurchasedGames()
        external
        view
        returns (GameLibrary.Game[] memory)
    {
        uint256 purchasedCount = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (gamePurchasers[gameIds[i]][msg.sender]) {
                purchasedCount++;
            }
        }

        GameLibrary.Game[] memory purchasedGames = new GameLibrary.Game[](
            purchasedCount
        );
        uint256 index = 0;
        for (uint256 i = 0; i < gameIds.length; i++) {
            if (gamePurchasers[gameIds[i]][msg.sender]) {
                purchasedGames[index] = games[gameIds[i]];
                index++;
            }
        }

        return purchasedGames;
    }
}
