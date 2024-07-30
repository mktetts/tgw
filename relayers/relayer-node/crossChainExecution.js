const { ethers } = require("ethers");
const { Web3 } = require("web3");
const fs = require("fs");

async function crossChainCall(data, allNetworks) {
    try {
        const eventData = data.data;
        const targetNetwork = allNetworks[eventData.args.targetChainId];
        console.log(targetNetwork)
        if (targetNetwork.chainId === "365") {
            console.log("dataaaa", eventData)
            const provider = new ethers.JsonRpcProvider(targetNetwork.rpcUrl);
            const txResponse = await provider.broadcastTransaction(data.signedTx.rawTransaction.serialized);
            const receipt = await txResponse.wait();
            return receipt
        }
        console.log("dataaaa", eventData)
        const web3 = new Web3(targetNetwork.rpcUrl);
        const receipt = await web3.eth.sendSignedTransaction(
            data.signedTx.rawTransaction
        );
        return receipt;
    } catch (e) {
        console.log(e)
        return({data: data, error: e.message})
    }
}

module.exports = crossChainCall;
