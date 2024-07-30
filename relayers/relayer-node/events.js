const { ethers } = require("ethers");
const { Web3 } = require("web3");
const fs = require("fs");

class EventListener {
    constructor(network) {
        this.network = JSON.parse(network);
        this.provider = new ethers.JsonRpcProvider(this.network.rpcUrl);
        this.onChain = JSON.parse(
            require("fs").readFileSync("./abis/onchain.json", "utf8")
        );
        this.offChain = JSON.parse(
            require("fs").readFileSync("./abis/offchain.json", "utf8")
        );
        this.contract = new ethers.Contract(
            this.network.onChainContract,
            this.onChain,
            this.provider
        );
        console.log("Relayer Started Listening on ", this.network.chainName);
    }

    setupEventHandlers() {
        this.contract.on("CrossChainMessageInitiated", async (...args) => {
            const event = args[args.length - 1];
            const formattedEvent = {
                event: event.fragment.name,
                contractAddress: this.network.onChainContract,
                transactionHash: event.log.transactionHash,
                blockHash: event.log.blockHash,
                blockNumber: event.log.blockNumber,
                address: event.log.address,
                data: event.log.data,
                topics: event.log.topics,
                args: {
                    messageHash: event.args[0],
                    targetChainId: event.args[1].toString(),
                    message: event.args[2],
                    receiver: event.args[2][0],
                    data: event.args[2][1],
                    networkFees: event.args[3].toString(),
                    value: event.args[4].toString(),
                    sender: event.args[5].toString(),
                    gasPrice: event.args[6].toString()
                },
            };
            
            console.log("event received");
            // this.executeCrossChainCall(formattedEvent)
            // Send message to parent process
            process.send(formattedEvent);
        });

        // Add more event handlers as needed for different events
    }
    start() {
        this.setupEventHandlers();

        // Keep the process running indefinitely (or handle as needed)
        process.on("SIGINT", () => {
            console.log(
                `Exiting child process for ${this.network.onChainContract}`
            );
            process.exit();
        });

        process.on("uncaughtException", (err) => {
            console.error(
                `Uncaught exception in child process for ${this.network.onChainContract}:`,
                err
            );
            process.exit(1);
        });
    }
}

const network = process.argv[2];
const listener = new EventListener(network);
listener.start();
