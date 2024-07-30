require("dotenv").config();
const startContractListening = require('./contractListener')

startContractListening(process.env.AGGREGATION_NODE_RPC_URL, process.env.DATABASE_NAME, process.env.DATABASE_URL)