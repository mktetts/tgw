const { ethers, parseEther, formatEther } = require('ethers');
const { Web3, eth, FormatterError } = require('web3');
const fs = require('fs');
const { addTransaction } = require('../db/db');

require('dotenv').config();
const networks = JSON.parse(fs.readFileSync('networks.json', 'utf8'));
async function signTransaction(data, allNetworks) {
    try {
        const targetNetwork = allNetworks[data.args.targetChainId];
        const offchain = JSON.parse(fs.readFileSync('./abis/offchain.json', 'utf8'));
        let encodedData, gasLimit, gasPrice, price, signedTx;
        if (targetNetwork.chainId === '365') {
            try {
                const provider = new ethers.JsonRpcProvider(targetNetwork.rpcUrl);
                const wallet = new ethers.Wallet(process.env[`EOA_ACCOUNT_${targetNetwork.chainId}`], provider);
                const contract = new ethers.Contract(targetNetwork.offChainContract, offchain, wallet);

                const messageInfo = {
                    receiver: data.args.receiver,
                    data: data.args.data
                };
                let txReceipt;
                const balance = Number(ethers.formatEther(String(await provider.getBalance(wallet.address))));
                if (data.args.value !== '0') {
                    price = ethers.formatEther(String(data.args.value));
                    const sourceChain = networks.find(item => item.onChainContract === data.contractAddress);
                    const rpcUrl = sourceChain.rpcUrl;
                    const privateKe = process.env[`EOA_ACCOUNT_${sourceChain.chainId}`];

                    const provider = new ethers.JsonRpcProvider(rpcUrl);
                    const wall = new ethers.Wallet(privateKe, provider);
                    
                    const payingValue = Number(ethers.formatEther(data.args.value));
                    console.log('balance:', balance);
                    console.log('payingValue', payingValue);
                    if (balance < payingValue) {


                        const feesAbi = JSON.parse(fs.readFileSync('./abis/fees.json', 'utf8'));
                        const feesContract = new ethers.Contract(sourceChain.feesContract, feesAbi, wall);

                        let refundAmount = Number(ethers.formatEther(data.args.networkFees)).toFixed(5);
                        console.log(refundAmount);

                        try {
                            const tx = await feesContract.addRefund(data.args.sender, {
                                value: ethers.parseEther(refundAmount),
                                gasPrice: parseInt(data.args.gasPrice),
                                gasLimit: 2000000
                            });

                            // const receipt = await tx.wait();
                            // console.log(receipt);
                        } catch (e) {
                            console.log(e);
                        }
                        return { transaction: data, error: 'Too much purchasing amount than expected, refund will be initiated shortly' };
                    }
                    console.log({
                        value: ethers.parseEther(price),
                        gasPrice: parseInt(data.args.gasPrice),
                        gasLimit: 2000000
                    })
                    const tx = await contract.crossChainMessageReceiveWithAmount(messageInfo, {
                        value: ethers.parseEther(price),
                        gasPrice: parseInt(data.args.gasPrice),
                        gasLimit: 2000000
                    });
                    console.log(tx)
                    // delete tx[signature]
                    txReceipt = tx;
                    // txReceipt = await tx.wait();
                } else {
                    const tx = await contract.crossChainMessageReceive(messageInfo);
                    // console.log("tx:", tx)
                    // delete tx[signature]
                    txReceipt = tx;
                    // txReceipt = await tx.wait();
                }

                let transaction = {
                    source: data,
                    destination: txReceipt,
                    gasPrice: parseInt(data.args.gasPrice),
                    gasLimit: 2000000
                };
                await addTransaction(transaction);
                return { chain: 'theta', transaction: transaction };
            } catch (e) {
                console.log(e)
                return { transaction: data, error: e.message };
            }
        }

        const web3 = new Web3(targetNetwork.rpcUrl);
        const privateKey = process.env[`EOA_ACCOUNT_${targetNetwork.chainId}`];

        // Create an account object from the private key
        const account = web3.eth.accounts.privateKeyToAccount(privateKey);
        // Provide the account with the web3 instance to sign transactions
        web3.eth.accounts.wallet.add(account);
        const web3Contract = new web3.eth.Contract(offchain, targetNetwork.offChainContract);
        const messageInfo = {
            receiver: data.args.receiver,
            data: data.args.data
        };

        if (data.args.value !== '0') {
            price = ethers.formatEther(String(data.args.value));
            encodedData = web3Contract.methods.crossChainMessageReceiveWithAmount(messageInfo).encodeABI();
            let balance = await web3.eth.getBalance(account.address);
            balance = Number(web3.utils.fromWei(balance, 'ether'));
            const payingValue = ((Number(ethers.formatEther(data.args.value))).toFixed(10));
            console.log('balance:', balance);
            console.log('payingValue', payingValue);
            if (balance < payingValue) {
                const sourceChain = networks.find(item => item.onChainContract === data.contractAddress);

                const sweb3 = new Web3(sourceChain.rpcUrl);

                const privateKe = process.env[`EOA_ACCOUNT_${sourceChain.chainId}`];
                const account = sweb3.eth.accounts.privateKeyToAccount(privateKe);
                sweb3.eth.accounts.wallet.add(account);
                
                const fees = JSON.parse(fs.readFileSync('./abis/fees.json', 'utf8'));
                const feesContract = new sweb3.eth.Contract(fees, sourceChain.feesContract);
                let refundAmount = Number(ethers.formatEther(data.args.networkFees)).toFixed(5);
                // console.log(feesContract)
                console.log(refundAmount);
                try {
                    feesContract.methods.addRefund(data.args.sender).send({
                        from: account.address,
                        value: ethers.parseEther(refundAmount),
                        gasPrice: parseInt(await sweb3.eth.getGasPrice()),
                        gas: 10000000
                    });
                } catch (e) {
                    console.log(e);
                }
                return { transaction: data, error: 'Too much purchasing amount than expected, refund will be initiated shortly' };
            }
            const txObject = {
                from: account.address,
                to: targetNetwork.offChainContract,
                gasPrice: parseInt(data.args.gasPrice),
                data: encodedData,
                gas: 2000000,
                value: ethers.parseEther(payingValue)
            };
            // console.log(txObject)
            // Sign the transaction
            signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
            // return {
            //     data : data,
            //     signedTx: signedTx,
            //     gasLimit: 200000,
            //     gasPrice: parseInt(await web3.eth.getGasPrice())
            // }

            // const method = web3Contract.methods.crossChainMessageReceiveWithAmount(messageInfo);
            // gasLimit = parseInt(await method.estimateGas({ from: account.address }));
            // console.log("gasLimit", gasLimit)
            // gasPrice = parseInt(await web3.eth.getGasPrice());
            // console.log("gasPrice", gasPrice)
        } else {
            encodedData = web3Contract.methods.crossChainMessageReceive(messageInfo).encodeABI();
            const method = web3Contract.methods.crossChainMessageReceive(messageInfo);
            gasLimit = parseInt(await method.estimateGas({ from: account.address }));
            
            const txObject = {
                from: account.address,
                to: targetNetwork.offChainContract,
                gasPrice: parseInt(data.args.gasPrice),
                data: encodedData,
                gas: gasLimit
            };
            // console.log(txObject)
            // Sign the transaction
            signedTx = await web3.eth.accounts.signTransaction(txObject, privateKey);
        }
        return {
            data: data,
            signedTx: signedTx,
            gasLimit: 2000000,
            gasPrice: parseInt(data.args.gasPrice)
        };
    } catch (e) {
        return { transaction: data, error: e.message };
    }
}

module.exports = signTransaction;
