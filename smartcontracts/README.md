# Contract Details
-----

There are 6 blockchains are supported as of now.
- Theta Testnet
- Sepolia
- Arbitrum sepolia
- Base sepolia
- Polygon Amoy
- Gnosis Testnet

`For Testing:`
- For Testing the application, no need for deployments.
- If you want to deploy with own, dont forget to fill the .env files.
- Once deployed, change the deployed address on `relayers/aggregation-node/networks.json` file and `tgw/ui/src/blockchain/networks.js` files.
- If anything changed in contract means, dont forget to change the `abi` folder inside the `aggregation node and relayer node folders`

To deploy the smart contracts, please fill the .env file with private key and respective EOA accout. This EOA account responsible for the cross chain transaction. Then

```
 npm i # this will install the dependencies
 npm run theta
 npm run amoy
 npm run sepolia
 npm run base
 npm run arbitrum
 npm run gnosis

```
These commands will deploy the smart contracts in respective blockchains. **For Theta Blockchain alone, I deployed using Remix, since Hardhat unable to deploy.**



# Contribution Contract Documentation

## Overview

The `Contribution` contract allows users to contribute Crypto, manage contributions, and interact with a coupon system.

## Key Components

- **Admin**: Contract deployer with exclusive rights.
- **Coupon Contract**: External contract for managing coupons.

## State Variables

- **admin**: Address of the contract admin.
- **couponContract**: External contract implementing `ICoupon`.
- **nonce**: Contribution counter.
- **allContributions**: Array of all contributions.
- **overAllContribution**: Total Crypto contributed.
- **contributions**: Mapping of contributor addresses to their total contributions.

## Structs

- **ContributionDetails**: 
  - `contributor`: Contributor's address.
  - `value`: Contribution amount.
  - `timestamp`: Contribution time.

## Modifiers

- **onlyAdmin**: Restricts function access to the admin.

## Functions

- **constructor(address _couponContract)**
  - Initializes admin and coupon contract address.
  
- **addContribution()**
  - Users contribute Crypto. Updates contributions, assigns coupons, and transfers 60% balance to admin every third contribution.
  
- **getMyContribution(address contributor)**
  - Returns the total contribution of the specified address.
  
- **getOverAllContribution()**
  - Returns the total contributions.
  
- **getAllContributions()**
  - Returns all contribution details.
  
- **withdrawFunds(uint256 amount)**
  - Admin withdraws specified Crypto amount.
  
- **withdrawCouponValue(bytes32 couponId)**
  - Users withdraw value of a valid coupon.
  
- **getBalance()**
  - Returns the contract's Crypto balance.


---

# Coupon Contract Documentation

## Overview

The `Coupon` contract manages coupon issuance, validation, and redemption for contributors. Coupons are assigned based on contribution thresholds.

## Key Components

- **Admin**: Contract deployer with exclusive rights.
- **COUPON_VALIDITY_PERIOD**: Validity period for coupons (96 hours).

## State Variables

- **admin**: Address of the contract admin.
- **couponValue**: Mapping of contribution thresholds to coupon values.
- **coupons**: Mapping of contributor addresses to their coupons.
- **thresholds**: Array of all threshold values.

## Structs

- **Coupon**: 
  - `id`: Unique identifier for the coupon.
  - `value`: Coupon value.
  - `timestamp`: Expiry timestamp of the coupon.
  - `used`: Flag indicating if the coupon is used.
  - `withdrawn`: Flag indicating if the coupon value is withdrawn.

## Modifiers

- **onlyAdmin**: Restricts function access to the admin.

## Functions

- **constructor()**
  - Initializes the admin and sets up initial coupon thresholds and values.
  
- **addCoupon(uint256 _value, uint256 _offer)**
  - Adds a new coupon threshold and value.
  
- **checkAndAssignCoupon(address contributor, uint256 totalContribution)**
  - Checks if the total contribution meets any thresholds and assigns the highest applicable coupon.
  
- **generateUniqueId(address contributor, uint256 value, uint256 timestamp)**
  - Generates a unique ID for a coupon.
  
- **isCouponValid(address contributor, bytes32 couponId)**
  - Checks if a coupon is valid.
  
- **isCouponValidAndGetAmount(address contributor, bytes32 couponId)**
  - Checks if a coupon is valid and returns its value.
  
- **getMyCoupons(address contributor)**
  - Returns all coupons for a contributor.
  
- **getThresholds()**
  - Returns all contribution thresholds.
  
- **transferCoupon(address originalOwner, address to, bytes32 couponId)**
  - Transfers a coupon from one address to another.
  
- **markCouponAsWithdrawn(address contributor, bytes32 couponId)**
  - Marks a coupon as withdrawn.

---

# FeeCollector Contract Documentation

## Overview

The `FeeCollector` contract manages Crypto deposits, refunds, and withdrawals. It includes functionality to deposit funds directly to an externally owned account (EOA) and track refunds for users.

## Key Components

- **Owner**: Contract deployer with exclusive rights.
- **EOA**: Externally owned account to receive deposits.
- **Deposit Event**: Event emitted on deposit.

## State Variables

- **owner**: Address of the contract owner.
- **eoa**: Address of the externally owned account.
- **refundedAmount**: Mapping of user addresses to their refundable amounts.

## Modifiers

- **onlyOwner**: Restricts function access to the owner.

## Functions

- **constructor(address _eoa)**
  - Sets the contract owner to the deployer and initializes the EOA.
  
- **deposit()**
  - Allows users to deposit Crypto, which is transferred to the EOA. Emits a deposit event.
  
- **refundAmount()**
  - Allows users to withdraw their refundable amounts.
  
- **receive()**
  - Fallback function to receive Crypto.
  
- **addRefund(address user)**
  - Adds a refundable amount for a user. Only the owner can call this function.
  
- **withdrawAll()**
  - Withdraws all Crypto from the contract to the owner's address.
  
- **getBalance()**
  - Returns the balance of the EOA.
  
- **getEOA()**
  - Returns the EOA address.

---

# OffChain Contract Documentation

## Overview

The `OffChain` contract facilitates the reception and execution of cross-chain messages, with support for both standard and value-bearing messages.

## Key Components

- **Message Library**: Utilized for structuring message information.

## Functions

- **crossChainMessageReceive(Message.MessageInfo calldata message)**
  - Receives and executes a cross-chain message without transferring Crypto.
  - Calls the specified receiver with the provided data.
  
- **crossChainMessageReceiveWithAmount(Message.MessageInfo calldata message)**
  - Receives and executes a cross-chain message while transferring Crypto.
  - Calls the specified receiver with the provided data and attached Crypto.
 ---

 # OnChain Contract Documentation

## Overview

The `OnChain` contract facilitates sending cross-chain messages and manages gas and fee settings. It interacts with a `FeeCollector` contract to handle message-related fees.

## Key Components

- **Admin**: Contract deployer with exclusive rights.
- **FeeCollector**: External contract for managing fees.
- **Gas and Fee Settings**: Configurable parameters for gas limits, gas price, and relayer fees.

## State Variables

- **admin**: Address of the contract admin.
- **feeCollector**: External contract implementing `IFeeCollector`.
- **gas_limit**: Gas limit for message execution (not yet used).
- **dest_gas_per_payload_byte**: Gas per payload byte for the destination chain (not yet used).
- **relayer_fee**: Fee for relaying messages (in wei).
- **executionGasPrice**: Gas price for execution (not yet used).

## Modifiers

- **onlyAdmin**: Restricts function access to the admin.

## Functions

- **constructor(address _feeCollectorAddress)**
  - Initializes the admin and sets the fee collector address.

- **updateGasLimit(uint256 _gasLimit)**
  - Updates the gas limit. Admin only.

- **updateDestGasPerPayloadByte(uint256 _destGasPerPayloadByte)**
  - Updates the gas per payload byte for the destination chain. Admin only.

- **updateRelayerFee(uint256 _relayerFee)**
  - Updates the relayer fee. Admin only.

- **getGasLimit()**
  - Returns the current gas limit (internal view).

- **getDestGasPerPayloadByte()**
  - Returns the current gas per payload byte (internal view).

- **getRelayerFee()**
  - Returns the current relayer fee (internal view).

- **CrossChainMessageSend(uint256 _targetChainId, Message.MessageInfo calldata _message, uint256 networkFee, uint256 value, address sender, uint256 gasPrice)**
  - Sends a cross-chain message. Emits `CrossChainMessageInitiated` event.

- **getFee()**
  - Returns the relayer fee.

## Events

- **CrossChainMessageInitiated**
  - Emitted when a cross-chain message is sent.
  - Parameters: `messageHash`, `targetChainId`, `message`, `networkFee`, `value`, `sender`, `gasPrice`.

---

# NFT Contract Documentation

## Overview

The `NFT` contract manages NFTs with capabilities for minting, burning, transferring, and purchasing tokens. It integrates with a coupon system to enable discounted purchases.

## Key Components

- **Token**: Represents an NFT with properties such as ID, store key, price, sold status, owner, and locked status.
- **Coupon**: External contract for managing coupon validation and transfers.

## State Variables

- **couponContract**: Address of the `ICoupon` contract.
- **tokenId**: Counter for the next token ID.
- **tokens**: Mapping from game ID to token ID to the `Token` struct.

## Functions

- **constructor(address _couponContract)**
  - Initializes the contract with the address of the `ICoupon` contract.

- **mint(address to, bytes32 gameId, bytes32 storekey, uint256 _price)**
  - Mints a new token and assigns it to the specified address.

- **burn(bytes32 gameId, uint256 _tokenId, address burner)**
  - Burns a token, ensuring the burner is the owner and the token is not locked.

- **transfer(bytes32 gameId, address to, uint256 _tokenId)**
  - Transfers ownership of a token to a specified address.

- **getUnsoldTokens(bytes32 gameId)**
  - Returns an array of unsold tokens for the specified game.

- **getLockedTokens(bytes32 gameId)**
  - Returns an array of locked tokens for the specified game.

- **buyToken(bytes32 gameId, uint256 _tokenId, address _buyer)**
  - Allows a buyer to purchase a token by sending the correct amount of Ether.

- **buyTokenWithCoupon(bytes32 couponId, bytes32 gameId, uint256 _tokenId, address _buyer)**
  - Allows a buyer to purchase a token using a coupon for a discount.

- **getMyTokens(bytes32 gameId, address sender)**
  - Returns an array of tokens owned by the specified address for the specified game.

- **lockNFT(bytes32 gameId, uint256 _tokenId)**
  - Locks a token, preventing transfers.

- **unLockNFT(bytes32 gameId, uint256 _tokenId, address owner)**
  - Unlocks a token, allowing transfers.

- **getTokenOwner(uint256 _tokenId, bytes32 gameId)**
  - Returns the owner of a specified token.

- **getTokenPrice(uint256 _tokenId, bytes32 gameId)**
  - Returns the price of a specified token.

- **getNFTById(bytes32 gameId, uint256 _tokenId)**
  - Returns the `Token` struct for the specified game and token ID.


---

# NFTLending Contract Documentation

## Overview

The `NFTLending` contract allows users to lend and rent NFTs for a specified period and amount. It manages lending operations, tracks active lendings, and handles NFT returns.

## Key Components

- **Lending**: Represents a lending operation with details about the NFT, lender, borrower, and terms.
- **nftContract**: An instance of the `NFT` contract used to manage NFT operations.

## State Variables

- **nftContract**: Address of the `NFT` contract.
- **lendingCount**: Counter for the next lending ID.
- **lendings**: Mapping from lending ID to the `Lending` struct.
- **isLent**: Mapping from token ID to a boolean indicating whether the NFT is currently lent.

## Events

- **NFTLent**
  - Emitted when an NFT is successfully lent.
  - Parameters: `lendingId`, `lender`, `tokenId`, `duration`, `lendingAmount`.

- **NFTRented**
  - Emitted when an NFT is successfully rented.
  - Parameters: `lendingId`, `borrower`, `startTime`, `endTime`.

- **NFTRetrieved**
  - Emitted when an NFT is successfully retrieved by the lender.
  - Parameters: `lendingId`, `lender`.

## Functions

- **constructor(address _nftContract)**
  - Initializes the contract with the address of the `NFT` contract.

- **lendNFT(uint256 tokenId, uint256 lendingAmount, uint256 duration, bytes32 gameId, string calldata gameName)**
  - Lends an NFT from the caller to a borrower.
  - Requirements:
    - Caller must be the owner of the NFT.
    - NFT must not be currently lent.
  - Transfers the NFT to the contract for locking.

- **rentNFT(uint256 lendingId)**
  - Allows a user to rent an NFT by sending the required amount.
  - Requirements:
    - Lending must be active.
    - NFT must not be already rented.
    - Correct amount must be sent.

- **retrieveNFT(uint256 lendingId)**
  - Allows the lender to retrieve the NFT after the lending period or if it hasn't been rented yet.
  - Transfers the NFT back to the lender and the lending amount if applicable.
  - Requirements:
    - Lending must be active.
    - Caller must be the lender.

- **getBorrowedNFTs(address borrower, uint256 currentTime)**
  - Returns an array of lendings where the specified address is the borrower and the lending is still active.
  - Parameters: `borrower`, `currentTime`.

- **getLending(uint256 lendingId)**
  - Returns the details of a specific lending operation.
  - Parameters: `lendingId`.

- **getActiveLendings()**
  - Returns an array of all active lendings.

## Usage

1. **Lending an NFT**
   - Call `lendNFT` with the token ID, lending amount, duration, game ID, and game name.
   
2. **Renting an NFT**
   - Call `rentNFT` with the lending ID and send the required amount.

3. **Retrieving an NFT**
   - Call `retrieveNFT` with the lending ID. The NFT will be returned to the lender, and the lending amount will be transferred if applicable.

4. **Querying Borrowed NFTs**
   - Call `getBorrowedNFTs` with the borrower's address and current time.

5. **Querying Active Lendings**
   - Call `getActiveLendings` to get all active lending operations.

This contract ensures secure lending and renting of NFTs while keeping track of the state and validity of each operation.

---

# Games Contract Documentation

## Overview

The `Games` contract manages game listings and purchases. It allows users to add games, buy games, and query game information.

## Key Components

- **GameLibrary**: External library defining the `Game` struct used in this contract.

## State Variables

- **gameIds**: Array of all game IDs.
- **games**: Mapping from game ID to `GameLibrary.Game` struct, storing game details.
- **gamePurchasers**: Mapping from game ID to purchaser address, tracking which users have bought which games.

## Events

- **GameAdded**
  - Emitted when a new game is added.
  - Parameters: `gameId`, `gameName`, `gameOwner`.

- **GamePurchased**
  - Emitted when a game is purchased.
  - Parameters: `gameId`, `buyer`.

## Functions

- **addGame(GameLibrary.Game memory newGame)**
  - Adds a new game to the contract.
  - Parameters: `newGame` (a `GameLibrary.Game` struct).
  - Updates the `games` mapping and `gameIds` array.
  - Emits the `GameAdded` event.

- **getGameId(uint256 nonce) external view returns (bytes32)**
  - Generates a unique game ID based on the sender's address and a nonce.
  - Parameters: `nonce` (a unique number).
  - Returns: Generated `bytes32` game ID.

- **getAllGames() external view returns (GameLibrary.Game[] memory)**
  - Returns an array of all games stored in the contract.
  - Returns: Array of `GameLibrary.Game` structs.

- **buyGame(bytes32 gameId, address buyer) public payable**
  - Allows a user to purchase a game by sending the correct amount of ETH.
  - Parameters: `gameId` (ID of the game to buy), `buyer` (address of the buyer).
  - Requirements:
    - Game ID must be valid.
    - The value sent must equal the game's price.
    - The game must not have been purchased by the buyer already.
  - Transfers the game price to the game owner and updates the `gamePurchasers` mapping.
  - Emits the `GamePurchased` event.

- **hasPurchased(bytes32 gameId, address buyer) external view returns (bool)**
  - Checks if a specific address has purchased a particular game.
  - Parameters: `gameId` (ID of the game), `buyer` (address to check).
  - Returns: `true` if the game has been purchased by the address, otherwise `false`.

- **getPurchasedGames() external view returns (GameLibrary.Game[] memory)**
  - Returns an array of games that the caller has purchased.
  - Uses the `gamePurchasers` mapping to filter games that the caller has bought.
  - Returns: Array of `GameLibrary.Game` structs.

## Usage

1. **Adding a Game**
   - Call `addGame` with a `GameLibrary.Game` struct containing game details.

2. **Buying a Game**
   - Call `buyGame` with the `gameId` of the game and send the correct amount of ETH.

3. **Checking Purchase Status**
   - Call `hasPurchased` to check if a specific address has purchased a game.

4. **Getting All Games**
   - Call `getAllGames` to retrieve a list of all games in the contract.

5. **Getting Purchased Games**
   - Call `getPurchasedGames` to get a list of games purchased by the caller.

This contract provides functionality for managing games and tracking purchases within a decentralized application.


---

# Messaging Contract Documentation

## Overview

The `Messaging` contract facilitates cross-chain communication for NFT and game-related operations. It enables actions like minting, buying, and teleporting NFTs, as well as creating and purchasing games across different blockchain networks.

## Dependencies

- **ICrossChainMessage**: Interface for cross-chain messaging.
- **Message**: Library defining message structures.
- **GameLibrary**: Library defining the `Game` struct.
- **NFT**: Contract for NFT operations.
- **Games**: Contract for game operations.

## State Variables

- **onChainContract**: Instance of the `ICrossChainMessage` contract for sending cross-chain messages.
- **nft**: Instance of the `NFT` contract.
- **games**: Instance of the `Games` contract.

## Constructor

- **constructor(address _onChainContract, address _nftAddress, address _gameAddress)**
  - Initializes the contract with addresses for `ICrossChainMessage`, `NFT`, and `Games`.

## Functions

### mintNFT

- **mintNFT(
    uint64 _targetChainId,
    address _receiverAddress,
    bytes32 gameId,
    address to,
    bytes32 storekey,
    uint256 price,
    uint256 gasPrice
  ) external payable returns (bytes32)**
  
  - Mints an NFT on the target chain.
  - Parameters:
    - `_targetChainId`: ID of the target blockchain.
    - `_receiverAddress`: Address of the target contract on the target blockchain.
    - `gameId`: ID of the game associated with the NFT.
    - `to`: Address to receive the new NFT.
    - `storekey`: Key for storing the NFT.
    - `price`: Price of the NFT.
    - `gasPrice`: Gas price for the transaction.
  - Returns: `bytes32` message hash.

### buyNFT

- **buyNFT(
    uint64 _targetChainId,
    address _receiverAddress,
    bytes32 gameId,
    uint256 tokenId,
    address buyer,
    uint256 nftPrice,
    uint256 gasPrice
  ) external payable returns (bytes32)**
  
  - Initiates the purchase of an NFT on the target chain.
  - Parameters:
    - `_targetChainId`: ID of the target blockchain.
    - `_receiverAddress`: Address of the target contract on the target blockchain.
    - `gameId`: ID of the game associated with the NFT.
    - `tokenId`: ID of the NFT.
    - `buyer`: Address of the buyer.
    - `nftPrice`: Price of the NFT.
    - `gasPrice`: Gas price for the transaction.
  - Returns: `bytes32` message hash.

### teleportNFT

- **teleportNFT(
    uint64 _targetChainId,
    address _receiverAddress,
    bytes32 gameId,
    uint256 tokenId,
    address to,
    uint256 price,
    uint256 gasPrice
  ) external payable returns (bytes32)**
  
  - Burns an NFT on the current chain and mints it on the target chain.
  - Parameters:
    - `_targetChainId`: ID of the target blockchain.
    - `_receiverAddress`: Address of the target contract on the target blockchain.
    - `gameId`: ID of the game associated with the NFT.
    - `tokenId`: ID of the NFT to be teleported.
    - `to`: Address to receive the NFT on the target chain.
    - `price`: Price of the NFT.
    - `gasPrice`: Gas price for the transaction.
  - Returns: `bytes32` message hash.

### createGame

- **createGame(
    uint64 _targetChainId,
    address _receiverAddress,
    GameLibrary.Game memory newGame,
    uint256 gasPrice
  ) external payable returns (bytes32)**
  
  - Creates a new game on the target chain.
  - Parameters:
    - `_targetChainId`: ID of the target blockchain.
    - `_receiverAddress`: Address of the target contract on the target blockchain.
    - `newGame`: `GameLibrary.Game` struct containing game details.
    - `gasPrice`: Gas price for the transaction.
  - Returns: `bytes32` message hash.

### buyGame

- **buyGame(
    uint64 _targetChainId,
    address _receiverAddress,
    bytes32 gameId,
    address buyer,
    uint256 gamePrice,
    uint256 gasPrice
  ) external payable returns (bytes32)**
  
  - Initiates the purchase of a game on the target chain.
  - Parameters:
    - `_targetChainId`: ID of the target blockchain.
    - `_receiverAddress`: Address of the target contract on the target blockchain.
    - `gameId`: ID of the game to be purchased.
    - `buyer`: Address of the buyer.
    - `gamePrice`: Price of the game.
    - `gasPrice`: Gas price for the transaction.
  - Returns: `bytes32` message hash.

### sendMessage

- **sendMessage(
    uint64 _targetChainId,
    address _receiverAddress,
    bytes memory _data,
    uint256 networkfees,
    uint256 value,
    address sender,
    uint256 gasPrice
  ) internal returns (bytes32)**
  
  - Sends a cross-chain message to the target chain.
  - Parameters:
    - `_targetChainId`: ID of the target blockchain.
    - `_receiverAddress`: Address of the target contract on the target blockchain.
    - `_data`: Encoded message data.
    - `networkfees`: Fee for the network transaction.
    - `value`: Value to be transferred with the message.
    - `sender`: Address of the sender.
    - `gasPrice`: Gas price for the transaction.
  - Returns: `bytes32` message hash.

### getFee

- **getFee() external view returns (uint256)**
  
  - Retrieves the current fee for sending cross-chain messages.
  - Returns: Network fee in `uint256`.

## Usage

1. **Mint NFT**: Call `mintNFT` with the target chain details, NFT information, and payment details to mint an NFT on the target chain.

2. **Buy NFT**: Call `buyNFT` with the target chain details, NFT information, and payment details to buy an NFT on the target chain.

3. **Teleport NFT**: Call `teleportNFT` to burn an NFT on the current chain and mint it on the target chain.

4. **Create Game**: Call `createGame` to add a new game on the target chain.

5. **Buy Game**: Call `buyGame` with the game ID and payment details to purchase a game on the target chain.

6. **Send Message**: Internal function used to send cross-chain messages.

7. **Get Fee**: Call `getFee` to get the current fee for cross-chain messaging.

This contract enables cross-chain operations for NFTs and games, leveraging message sending capabilities to interact with contracts on different blockchains.
