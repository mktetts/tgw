const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Admin = require("./models/admin");
const Network = require("./models/networks");
const Transactions = require("./models/trasnactions");

const connectDB = async (dbName, url) => {
    try {
        await mongoose.connect(url + dbName, {});
        console.log("Database connected");
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
};

const checkCredentials = async (username, password) => {
    const admin = await Admin.findOne({ username: username });
    if (!admin) return false;
    return bcrypt.compare(password, admin.password);
};

const createAdmin = async (username, password) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    const admin = new Admin({ username, password: hashedPassword });
    await admin.save();
};

const addNewNetwork = async (network) => {
    const newNetwork = new Network(network);
    await newNetwork.save();
};

const listAllNetworks = async () => {
    const allNetworks = await Network.find();
    return allNetworks;
};

const addTransaction = async (transaction) => {
    // console.log("transaction:" , transaction)
    let data = {
        messageHash: transaction.source?.args?.messageHash || null,
        sender:transaction.source?.args?.sender || null,
        sourceChain: transaction.source || null,
        destinationChain: transaction.destination || null,
        gasPrice: transaction.gasPrice !== undefined ? transaction.gasPrice : null,
        gasLimit: transaction.gasLimit !== undefined ? transaction.gasLimit : null,
        sourceChainTransactionHash: transaction.source?.transactionHash || null,
        destinationTransactionHash: transaction.destination?.transactionHash || transaction.destination?.hash || null,
        error: transaction.error || ""
    };

    const filter = { messageHash: data.messageHash };
    const update = data;
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    try {
        const updatedTransaction = await Transactions.findOneAndUpdate(filter, update, options);
        // console.log('Transaction successfully added or updated:', updatedTransaction);
    } catch (error) {
        console.error('Error adding or updating transaction:', error);
    }
};

const getAllTransactions = async() =>{
    const res = await Transactions.find()
    return res;
}

const getTransactions = async (data) => {
    const res = await Transactions.find(data).sort({ _id: -1 });
    return res;
};

module.exports = {
    connectDB,
    checkCredentials,
    createAdmin,
    addNewNetwork,
    listAllNetworks,
    addTransaction,
    getTransactions,
    getAllTransactions
};
