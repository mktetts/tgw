# Relayer Nodes

- Relayer nodes are much more important in our network.
- This nodes are appointed to listen the blockchain events.
- Whenever the **CrossChainMessageInitiated** event emitted, it receives that event and pass it to the aggregation node. 
- After signing the transaction, aggregation node randomly picks the relayer node and send the **signedTx** to relayer node, this relayer node broadcast the **signedTransaction** to the respective blockchain.
- And then store the copy of the transaction in its own database.

## How to run?

- First you have to run the **aggregation node**.
- If you want to run more relayer node, just copy one the relayer node folder, and in the .env file, change the database name (since, it is running in local)
#### For testing:
- Just run 
```
npm i
chmod +x script
./script
```

#### Own try:
- Install the dependencies
```
npm i
```

- Here **script** file is already filled.
```
chmod +x script
./script
```