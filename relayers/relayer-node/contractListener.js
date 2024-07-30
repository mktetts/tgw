const { fork } = require("child_process");
const path = require("path");
const io = require("socket.io-client");
const crossChainCall = require("./crossChainExecution");
const { connectDB, addTransaction } = require("./db/db");

class ContractEventListener {
    constructor(dbname, dburl) {
        this.networks = {};
        this.childProcesses = new Map();
        this.socket = null;
        this.monitorInterval = null;
        this.listeningBlockchain = {}
        connectDB(dbname, dburl)
    }

    startSocketServer(peerClient) {
        this.socket = io(peerClient);
        
        this.socket.on("connect", () => {
            
            this.socket.emit("listNetworks");
            console.log("Connected to Aggregation Node");
        });

        this.socket.on("disconnect", () => {
            console.log("Disconnected from Socket.IO server");
        });

        this.socket.on("newConfirmedTransaction", (data) => {
            console.log("New transaction received to store in database");
            addTransaction(data)
        });

        this.socket.on("signedTransaction", async (data) => {
            try {
                let receipt = await crossChainCall(data, this.networks);
                if(receipt.error){
                    let newTransaction = {
                        source: data.data,
                        error: receipt.error
                    };
                    this.socket.emit("newTransactionAdded", newTransaction);
                    return
                }
                let newTransaction = {
                    source: data.data,
                    destination: this.transformBigIntToString(receipt),
                    gasPrice: data.gasPrice,
                    gasLimit: data.gasLimit,
                };
                this.socket.emit("newTransactionAdded", newTransaction);
            } catch (err) {
                console.error("Error processing signed transaction:", err);
            }
        });

        this.socket.on("allNetworks", (data) => {
            this.networks = data;
            this.socket.emit('allTransactions')
            // console.log("Received all networks data:", data);
        });
        this.socket.on("allTransaction", async (data) =>{
            console.log("Started Syncing Transactions....")
            for(let i = 0; i < data.length; i++){
                await addTransaction(data[i])
            }
            console.log("Syncing Finished....")
            this.startListeners();
        })

        this.socket.on("newNetwork", (data) => {
            console.log("New network added:", data);
            this.startListening(data);
        });

        this.startMonitoring();
    }

    transformBigIntToString(obj) {
        return JSON.parse(
            JSON.stringify(obj, (key, value) =>
                typeof value === "bigint" ? value.toString() : value
            )
        );
    }

    startListeners() {
        Object.entries(this.networks).forEach(([chainId, network]) => {
            this.startListening(network);
        });
    }

    startListening(network) {
        const networkKey = `${network.chainName}-${network.chainId}`;
        // if(this.listeningBlockchain[network.chainId]) return;
        // this.listeningBlockchain[network.chainId] = true

        const startChildProcess = () => {
            const childProcess = fork(path.join(__dirname, "events.js"), [
                JSON.stringify(network),
            ]);

            childProcess.on("message", (message) => {
                if (this.socket) {
                    this.socket.emit("newevent", message);
                }
            });

            childProcess.on("error", (err) => {
                console.error(`Error in child process for ${networkKey}:`, err);
                this.restartListener(network);
            });

            childProcess.on("exit", (code, signal) => {
                console.log(
                    `Child process for ${networkKey} exited with code ${code} and signal ${signal}`
                );
                if (code !== 0) {
                    this.restartListener(network);
                }
            });

            this.childProcesses.set(networkKey, childProcess);
        };

        startChildProcess();
    }

    restartListener(network) {
        const networkKey = `${network.chainName}-${network.chainId}`;
        const existingProcess = this.childProcesses.get(networkKey);

        if (existingProcess) {
            existingProcess.kill();
            this.childProcesses.delete(networkKey);
        }

        console.log(`Restarting listener for ${networkKey}`);
        this.startListening(network);
    }

    stopListeners() {
        this.childProcesses.forEach((child, networkKey) => {
            console.log(`Stopping listener for ${networkKey}`);
            child.kill();
        });
        this.childProcesses.clear();
    }

    startMonitoring() {
        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
        }

        this.monitorInterval = setInterval(() => {
            console.log(`Currently listening to ${this.childProcesses.size} blockchains.`);
        }, 10000); 
    }
}

async function startContractListening(aggregationNode, dbname, dburl) {
    const eventListener = new ContractEventListener(dbname, dburl);
    eventListener.startSocketServer(aggregationNode);
    process.on("SIGINT", () => {
        console.log("Stopping all listeners...");
        eventListener.stopListeners();
        process.exit();
    });
}

module.exports = startContractListening;
