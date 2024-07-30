// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./NFT.sol";

contract NFTLending {
    NFT private nftContract;
    uint256 public lendingCount;

    struct Lending {
        uint256 lendingId;
        uint256 tokenId;
        bytes32 gameId;
        string gameName;
        address lender;
        address borrower;
        uint256 startTime;
        uint256 duration;
        uint256 lendingAmount;
        bool isActive;
    }

    mapping(uint256 => Lending) public lendings;
    mapping(uint256 => bool) public isLent;

    event NFTLent(
        uint256 indexed lendingId,
        address indexed lender,
        uint256 tokenId,
        uint256 duration,
        uint256 lendingAmount
    );
    event NFTRented(
        uint256 indexed lendingId,
        address indexed borrower,
        uint256 startTime,
        uint256 endTime
    );
    event NFTRetrieved(uint256 indexed lendingId, address indexed lender);

    constructor(address _nftContract) {
        nftContract = NFT(_nftContract);
    }

    function lendNFT(
        uint256 tokenId,
        uint256 lendingAmount,
        uint256 duration,
        bytes32 gameId,
        string calldata gameName
    ) external {
        require(
            nftContract.getTokenOwner(tokenId, gameId) == msg.sender,
            "You are not the owner of this NFT"
        );
        require(!isLent[tokenId], "NFT is already lent");

        // Approve the lending contract to transfer the NFT
        // nftContract.approve(address(this), tokenId);

        lendings[lendingCount] = Lending({
            lendingId: lendingCount,
            tokenId: tokenId,
            gameId: gameId,
            gameName: gameName,
            lender: msg.sender,
            borrower: address(0),
            startTime: 0,
            duration: duration,
            lendingAmount: lendingAmount,
            isActive: true
        });

        isLent[tokenId] = true;
        lendingCount++;

        // Transfer NFT to the contract for locking
        nftContract.lockNFT(gameId, tokenId);

        emit NFTLent(
            lendingCount - 1,
            msg.sender,
            tokenId,
            duration,
            lendingAmount
        );
    }

    function rentNFT(uint256 lendingId) external payable {
        Lending storage lending = lendings[lendingId];
        require(lending.isActive, "Lending is not active");
        require(lending.borrower == address(0), "NFT is already rented");
        require(msg.value == lending.lendingAmount, "Incorrect amount sent");

        lending.borrower = msg.sender;
        lending.startTime = block.timestamp;

        uint256 endTime = block.timestamp + lending.duration;
        
        emit NFTRented(lendingId, msg.sender, block.timestamp, endTime);
    }

    function retrieveNFT(uint256 lendingId) external {
        Lending storage lending = lendings[lendingId];
        require(lending.isActive, "Lending is not active");
        require(
            lending.lender == msg.sender,
            "You are not the lender of this NFT"
        );
        if (lending.startTime == 0) {
            lending.isActive = false;
            isLent[lending.tokenId] = false;

            // Transfer NFT back to the lender
            nftContract.unLockNFT(
                lending.gameId,
                lending.tokenId,
                lending.lender
            );

            emit NFTRetrieved(lendingId, msg.sender);
        } else {
            require(
                block.timestamp >= lending.startTime + lending.duration,
                "Lending period has not ended"
            );

            lending.isActive = false;
            isLent[lending.tokenId] = false;

            // Transfer NFT back to the lender
            nftContract.unLockNFT(
                lending.gameId,
                lending.tokenId,
                lending.lender
            );

            // Transfer the lending amount from the contract to the lender
            payable(lending.lender).transfer(lending.lendingAmount);

            emit NFTRetrieved(lendingId, msg.sender);
        }
    }

    function getBorrowedNFTs(address borrower, uint256 currentTime)
        external
        view
        returns (Lending[] memory)
    {
        uint256 borrowedCount = 0;
        for (uint256 i = 0; i < lendingCount; i++) {
            if (
                (lendings[i].borrower == borrower) &&
                (lendings[i].isActive) &&
                (currentTime < lendings[i].startTime + lendings[i].duration)
            ) {
                borrowedCount++;
            }
        }

        Lending[] memory borrowedNFTs = new Lending[](borrowedCount);
        uint256 index = 0;
        for (uint256 i = 0; i < lendingCount; i++) {
            if (
                (lendings[i].borrower == borrower) &&
                (lendings[i].isActive) &&
                (currentTime < lendings[i].startTime + lendings[i].duration)
            ) {
                borrowedNFTs[index] = lendings[i];
                index++;
            }
        }

        return borrowedNFTs;
    }

    function getLending(uint256 lendingId)
        external
        view
        returns (Lending memory)
    {
        return lendings[lendingId];
    }

    function getActiveLendings() external view returns (Lending[] memory) {
        uint256 activeCount = 0;
        for (uint256 i = 0; i < lendingCount; i++) {
            if (lendings[i].isActive) {
                activeCount++;
            }
        }

        Lending[] memory activeLendings = new Lending[](activeCount);
        uint256 index = 0;
        for (uint256 i = 0; i < lendingCount; i++) {
            if (lendings[i].isActive ) {
                activeLendings[index] = lendings[i];
                index++;
            }
        }

        return activeLendings;
    }
}
