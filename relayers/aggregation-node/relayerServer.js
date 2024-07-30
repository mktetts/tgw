const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const bodyParser = require("body-parser");
const crypto = require("crypto");
const fs = require("fs");
const cors = require("cors");
const signedTransaction = require("./blockchain/signTransaction");
const {
    connectDB,
    checkCredentials,
    createAdmin,
    addNewNetwork,
    listAllNetworks,
    addTransaction,
    getAllTransactions,
    getTransactions,
} = require("./db/db");

class RelayerServer {
    constructor(namespace, databaseName, databaseURL) {
        this.app = express();
        this.namespace = namespace
        this.relayers = [];
        this.eventPool = {};
        this.databaseName = databaseName;
        this.databaseURL = databaseURL
        this.allNetworks = {};
        this.latestPrice = {};
        this.allNetworks = JSON.parse(fs.readFileSync("networks.json", "utf8"));
        this.allNetworks = this.allNetworks.reduce((acc, network) => {
            acc[network.chainId] = {
                chainId: network.chainId,
                rpcUrl: network.rpcUrl,
                chainName: network.chainName,
                nativeCurrency: network.nativeCurrency,
                explorerUrl: network.explorerUrl,
                onChainContract: network.onChainContract,
                offChainContract: network.offChainContract,
                feesContract:network.feesContract
            };
            return acc;
        }, {});
        
       
        // Connect to the database
        connectDB(databaseName, databaseURL);
        this.setupSocket()
        // this.app.use(bodyParser.json());
        // this.app.use(cors());
       
        // this.app.get("/getTransactions", (req, res) =>
        //     this.getTransactions(req, res)
        // );
        // this.app.get("/listAllNetworks", (req, res) =>
        //     this.getAllNetworks(req, res)
        // );
    }


    calculateSHA256(input) {
        return crypto.createHash("sha256").update(input).digest("hex");
    }
    checkConsensus(hash, data) {
        addTransaction({source: data})
        if (this.relayers.length === 1) return true;
        if (this.eventPool[hash]) {
            this.eventPool[hash].count += 1;
            let consensus = this.relayers.length / 2 + 1;
            if (consensus <= this.eventPool[hash].count) {
                return true;
            }
        } else {
            this.eventPool[hash] = {
                transaction: data,
                count: 1,
            };
        }
        return false;
    }

    setupSocket() {
        this.namespace.on("connection", (socket) => {
            console.log("New Relayer connected");
            this.relayers.push(socket.id);
            socket.on("listNetworks", async () => {
               
                socket.emit("allNetworks", this.allNetworks);
                
            });
            socket.on("allTransactions", async() =>{
                const res = await getAllTransactions()
                socket.emit("allTransaction", res)
            })
            // Example of handling an event that requires admin privileges
            socket.on("newTransactionAdded", (data) => {
                // console.log(data)
                addTransaction(data);
                console.log("new transaction Receied to store in database");
                for (let i = 0; i < this.relayers.length; i++) {
                    this.namespace
                        .to(this.relayers[i])
                        .emit("newConfirmedTransaction", data);
                }
            });
            socket.on("newevent", async (data) => {
                const hash = this.calculateSHA256(JSON.stringify(data));
                if (this.checkConsensus(hash, data)) {
                    const res = await signedTransaction(data, this.allNetworks);
                    if(res.error){
                        addTransaction({source: res.transaction, error: res.error})
                        console.log("error happened")
                        return
                    }
                    if (res.chain === "theta") {
                        for (let i = 0; i < this.relayers.length; i++) {
                            this.namespace
                                .to(this.relayers[i])
                                .emit(
                                    "newConfirmedTransaction",
                                    res.transaction
                                );
                        }
                    } else {
                        const randomClientId = this.getRandomClient();
                        if (randomClientId) {
                            this.namespace
                                .to(randomClientId)
                                .emit("signedTransaction", res);
                        } else {
                            console.log(
                                "No relayers available to send data to."
                            );
                        }
                    }
                }
            });

            // Handle disconnect
            socket.on("disconnect", () => {
                console.log("Relayer disconnected");
            });
        });
    }

    getRandomClient() {
        if (this.relayers.length === 0) {
            return null;
        }
        const randomIndex = Math.floor(Math.random() * this.relayers.length);
        console.log("randomIndex", randomIndex);
        return this.relayers[randomIndex];
    }
    

    async getTransactions(req, res) {
        let data = req.body
        const response = await getTransactions(data);
        res.json({ success: true, data: response });
    }
    async getAllNetworks(req, res) {
        res.json({ success: true, data: this.networks });
    }

  

    // Start the server
    startServer(port) {
        this.databaseName = port;
        this.server.listen(port, () => {
            console.log(`Aggregation Server running on port ${port}`);
        });
    }
}

module.exports = RelayerServer;
