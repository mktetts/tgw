# Aggregation Node

- Aggregation node is the main node of our relayer network.
- This is responsible for 2 things
-- Price registry
-- Signing the incoming transaction and broadcast to the relayer
- This is the implementation of nodejs socket.io.
- In future, we try to implement in go or rust for best performance.
- Aggregation node is responsible for managing the blockchain networks.
- It is having the database, which stores the completed transactions.
- Price registry update the price for every 5 hrs(because, API is limited).
- All the users will interact with this price registry to fetch the live price.
- For explorer also, users use this aggregation node to fetch the transaction details.

AggreGation node run two socket
1. Aggregation node: http://localhost:4500/relayer-server
2. Live Price node : http://localhost:4500/price-server 

## How to run?

#### For testing:
- Just run 
```
npm i
chmod +x script
./script
```

#### Own try:

- Install dependencies
```
npm i
```

- Make  sure you have installed the mongodb database that fill the running url in script file.
- Fill the EOA_ACCOUNT_CHAINID field with private key of the EOA account. This is important for cross chain call initialization.
- **Make sure that entered private key account have some initial balance, or otherwise, the transaction will be reverted. Refund is implemented in the Node level, but not in UI level, because of timing contraints.**
- And then in the API_URL and API_KEY field, fill with GoinGeckco price url and API key for live price.
- Thats it, just run the script file like,
```
chmod +x script
./script
```

- If everything set propery, it is ready for its actions.