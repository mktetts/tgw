const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
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


const addTransaction = async (transaction) => {
    // console.log("transaction:" , transaction)
    let data = {
        messageHash: transaction.messageHash || null,
        sender:transaction.sender || null,
        sourceChain: transaction.sourceChain || null,
        destinationChain: transaction.destinationChain || null,
        gasPrice: transaction.gasPrice !== undefined ? transaction.gasPrice : null,
        gasLimit: transaction.gasLimit !== undefined ? transaction.gasLimit : null,
        sourceChainTransactionHash: transaction.sourceChainTransactionHash || null,
        destinationTransactionHash: transaction.destinationTransactionHash || transaction.destination?.hash || null,
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


const getTransactions = async (data) => {
    const res = await Transactions.find(data).sort({ _id: -1 });
    return res;
};

module.exports = {
    connectDB,
    addTransaction,
    getTransactions,
};
