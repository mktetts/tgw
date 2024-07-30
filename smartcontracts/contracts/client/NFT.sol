// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

// import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
interface ICoupon {
    struct Coupon {
        bytes32 id;
        uint256 value;
        uint256 timestamp;
        bool used;
        bool withdrawn;
    }

    function isCouponValidAndGetAmount(address contributor, bytes32 couponId)
        external
        view
        returns (bool, uint256);

    function transferCoupon(
        address originalOwner,
        address to,
        bytes32 couponId
    ) external;
}

contract NFT {
    ICoupon private couponContract;

    constructor(address _couponContract) {
        couponContract = ICoupon(_couponContract);
    }

    uint256 public tokenId;
    struct Token {
        uint256 id;
        bytes32 storekey;
        uint256 price;
        bool sold;
        address payable owner;
        bool locked;
    }

    // Mapping from gameId to token ID to Token struct
    mapping(bytes32 => mapping(uint256 => Token)) public tokens;
    
    function mint(
        address to,
        bytes32 gameId,
        bytes32 storekey,
        uint256 _price
    ) public {
        // _safeMint(to, tokenId);
        tokens[gameId][tokenId] = Token(
            tokenId,
            storekey,
            _price,
            false,
            payable(to),
            false
        );
         
        unchecked {
            tokenId++;
        }
    }

     function burn(bytes32 gameId, uint256 _tokenId, address burner) external returns (bool, bytes32) {
        Token memory burnedToken = tokens[gameId][_tokenId];
        require(burnedToken.owner == burner, "Only the owner can burn the token");
        require(!burnedToken.locked, "The NFT is rented");

        burnedToken.sold = true;
        delete tokens[gameId][_tokenId];

        return (true, burnedToken.storekey);
    }

    function transfer(
        bytes32 gameId,
        address to,
        uint256 _tokenId
    ) public {
        tokens[gameId][_tokenId].owner = payable(to);
        // _transfer(msg.sender, to, _tokenId);
    }

    function getUnsoldTokens(bytes32 gameId)
        external
        view
        returns (Token[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < tokenId; i++) {
            if (
                !tokens[gameId][i].sold && tokens[gameId][i].owner != address(0)
            ) {
                count++;
            }
        }

        Token[] memory unsoldTokens = new Token[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tokenId; i++) {
            if (
                !tokens[gameId][i].sold && tokens[gameId][i].owner != address(0)
            ) {
                unsoldTokens[index] = tokens[gameId][i];
                index++;
            }
        }

        return unsoldTokens;
    }

     function getLockedTokens(bytes32 gameId)
        external
        view
        returns (Token[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < tokenId; i++) {
            if (
                tokens[gameId][i].sold && tokens[gameId][i].locked
            ) {
                count++;
            }
        }

        Token[] memory lockedTokens = new Token[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tokenId; i++) {
            if (
                tokens[gameId][i].sold && tokens[gameId][i].locked
            ) {
                lockedTokens[index] = tokens[gameId][i];
                index++;
            }
        }

        return lockedTokens;
    }


    function buyToken(
        bytes32 gameId,
        uint256 _tokenId,
        address _buyer
    ) external payable {
        uint256 price = tokens[gameId][_tokenId].price;
        address seller = tokens[gameId][_tokenId].owner;
        require(msg.value == price, "Send the correct amount");
        tokens[gameId][_tokenId].owner = payable(_buyer);
        tokens[gameId][_tokenId].sold = true;
        // _transfer(seller, msg.sender, _tokenId);
        payable(seller).transfer(msg.value);
    }

    function buyTokenWithCoupon(
        bytes32 couponId,
        bytes32 gameId,
        uint256 _tokenId,
        address _buyer
    ) external payable {
        uint256 price = tokens[gameId][_tokenId].price;
        address seller = tokens[gameId][_tokenId].owner;

        // Validate coupon and get the coupon value
        (bool valid, uint256 couponValue) = couponContract
            .isCouponValidAndGetAmount(msg.sender, couponId);
        require(valid, "Coupon not valid or already withdrawn");
        require(couponValue > 0, "Coupon has no value");

        uint256 discountedPrice = price - couponValue;
        require(
            msg.value == discountedPrice,
            "Send the correct discounted amount"
        );

        tokens[gameId][_tokenId].owner = payable(_buyer);
        tokens[gameId][_tokenId].sold = true;
        // _transfer(seller, _buyer, _tokenId);

        // Transfer the coupon to the seller
        couponContract.transferCoupon(msg.sender, seller, couponId);

        // Transfer the discounted price to the seller
        payable(seller).transfer(msg.value);
    }

    function getMyTokens(bytes32 gameId, address sender)
        external
        view
        returns (Token[] memory)
    {
        uint256 count = 0;
        for (uint256 i = 0; i < tokenId; i++) {
            if (
                tokens[gameId][i].owner == sender &&
                !tokens[gameId][i].locked
            ) {
                count++;
            }
        }

        Token[] memory myTokens = new Token[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < tokenId; i++) {
            if (
                tokens[gameId][i].owner == sender &&
                !tokens[gameId][i].locked
            ) {
                myTokens[index] = tokens[gameId][i];
                index++;
            }
        }

        return myTokens;
    }

    function lockNFT(bytes32 gameId, uint256 _tokenId) external {
        Token storage token = tokens[gameId][_tokenId];
        token.locked = true;
    }

    function unLockNFT(bytes32 gameId, uint256 _tokenId, address owner) external {
        Token storage token = tokens[gameId][_tokenId];
        token.locked = false;
        token.owner = payable(owner);
    }

    // function transferNFT(address to, uint256 _tokenId, bytes32 gameId, address _lender) external {
    //     Token storage token = tokens[gameId][_tokenId];
    //     require(_lender == token.owner, "Only the owner can transfer the NFT");
    //     token.owner = payable(to);
    // }

    function getTokenOwner(uint256 _tokenId, bytes32 gameId)
        external
        view
        returns (address)
    {
        return tokens[gameId][_tokenId].owner;
    }

    function getTokenPrice(uint256 _tokenId, bytes32 gameId)
        external
        view
        returns (uint256)
    {
        return tokens[gameId][_tokenId].price;
    }

    function getNFTById(bytes32 gameId, uint256 _tokenId) external view returns(Token memory){
        return tokens[gameId][_tokenId];
    }

}
