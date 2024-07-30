const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    messageHash: {
        type: String,
        required: true,
        unique: true
    },
    sender: {
        type: String,
        required: true,
    },
    sourceChainTransactionHash: {
        type: String,
        required: true,
        default: null
    },
    destinationTransactionHash: {
        type: String,
        required: true,
        default: null
    },
    gasLimit: {
        type: Number,
        default: null
    },
    gasPrice: {
        type: Number,
        default: null
    },
    sourceChain: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: null
    },
    destinationChain: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
        default: null
    },
    error:{
        type: mongoose.Schema.Types.Mixed,
        required: false,
        default: ""
    }
});

const Transactions = mongoose.model('Transactions', transactionSchema);

module.exports = Transactions;
