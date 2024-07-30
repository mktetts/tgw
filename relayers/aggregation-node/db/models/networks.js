const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const networkSchema = new mongoose.Schema({
    // _id: { type: String, required: true, unique: true },
    chainId :  { type: String, required: true, unique: true },
    rpcUrl :  { type: String, required: true },
    chainName :  { type: String, required: true },
    nativeCurrency :  { type: String, required: true },
    explorerUrl :  { type: String, required: true },
    onChainContract :  { type: String, required: true },
    offChainContract:  { type: String, required: true },
});


const Network = mongoose.model('Networks', networkSchema);

module.exports = Network;
