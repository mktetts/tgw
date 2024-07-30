require("dotenv").config();
const http = require("http");
const socketIo = require("socket.io");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const PriceServer = require("./priceServer");
const RelayerServer = require("./relayerServer");

// Create Express app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO instance
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins. You can specify your client's URL here instead.
        methods: ["GET", "POST"]
    }
});

// Create namespaces
const socketServerNamespace = io.of("/relayer-server");
const priceSocketNamespace = io.of("/price-server");

// Create instances of your services using namespaces
const socketServer = new RelayerServer(socketServerNamespace, process.env.DATABASE_NAME, process.env.DATABASE_URL);
const apiUrl = process.env.API_URL;
const apiKey = process.env.API_KEY;
const interval = 5 * 60 * 60 * 1000; // 5 hours in milliseconds
const apiServer = new PriceServer(priceSocketNamespace, apiUrl, apiKey, interval);

// Define routes
app.post("/getTransactions", (req, res) => socketServer.getTransactions(req, res));
app.get("/listAllNetworks", (req, res) => socketServer.getAllNetworks(req, res));

// Start the server on the provided port
const PORT = process.env.AGGREGATION_NODE_PORT || 9900;
server.listen(PORT, () => {
    console.log(`Aggregation Node is running on port ${PORT}`);
});
