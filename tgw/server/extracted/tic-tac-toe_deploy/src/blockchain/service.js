import { ethers, formatEther, formatUnits, parseEther, parseUnits, verifyMessage } from 'ethers';
import Web3 from 'web3';
import { NETWORKS } from './networks';

export default class BlockchainService {
    static provider = null;
    static network = null;

    static generateAuthenticationMessage = () => {
        const timestamp = Date.now();
        const nonce = Math.floor(Math.random() * 1000000);
        const message = 'Hi, I want to login into Theta Game World';
        return `Authentication request\n Timestamp: ${timestamp} \nNonce: ${nonce} \n Message: ${message}`;
    };

    static changeNetwork = async network => {
        const chainIdHex = Web3.utils.toHex(network.chainId);
        if (window.ethereum.networkVersion !== network.chainId.toString()) {
            try {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIdHex }]
                });
                return true;
            } catch (err) {
                if (err.code === 4902) {
                    try {
                        await window.ethereum.request({
                            method: 'wallet_addEthereumChain',
                            params: [
                                {
                                    chainId: chainIdHex,
                                    chainName: network.chainName,
                                    rpcUrls: [network.rpcUrls],
                                    nativeCurrency: {
                                        name: network.nativeCurrency,
                                        symbol: network.nativeCurrency, // 2-6 characters long
                                        decimals: 18
                                    }
                                }
                            ]
                        });
                        console.log(`Added and switched to ${networkName}`);
                    } catch (addError) {
                        throw new Error('Network Cannot be Added');
                    }
                } else {
                    throw new Error('User Cancelled operation');
                }
            }
        } else {
            throw new Error('User Cancelled operation');
        }
    };

    static enableEthereum = async () => {
        if (window.ethereum) {
            window.ethereum.on('chainChanged', () => {
                window.location.reload();
            });
            window.ethereum.on('accountsChanged', () => {
                window.location.reload();
            });

            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.network = await this.provider.getNetwork();
            return true;
        }
        throw new Error('Oops!.. Looks like Metamask not installed. Please Install to Continue.');
    };
    static verifySignature = async (message, signature) => {
        const signer = await this.provider.getSigner();
        const recoveredAddress = verifyMessage(message, signature);
        return recoveredAddress.toLowerCase() === signer.address.toLowerCase();
    };
    static authenticate = async () => {
        const message = this.generateAuthenticationMessage();
        const provider = this.provider;
        const signature = await (await provider.getSigner()).signMessage(message);
        return await this.verifySignature(message, signature);
    };

    static async getSignerAccount() {
        if (!this.provider) {
            throw new Error('Oops!.. Looks like Metamask not installed. Please Install to Continue.');
        }
        try {
            const signer = await this.provider.getSigner();
            this.network = await this.provider.getNetwork();
            const balance = {
                balance: Number(formatEther(await this.provider.getBalance(signer.address))).toFixed(4)
            };
            const network = NETWORKS[this.network.chainId];
            return {
                address: signer.address,
                ...network,
                ...balance
            };
        } catch (error) {
            console.error('Failed to get signer:', error);
            throw new Error('Unable to retrieve signer account.');
        }
    }

    static async getCurrentNetwork() {
        if (!this.provider) {
            throw new Error('Oops!.. Looks like Metamask not installed. Please Install to Continue.');
        }
        try {
            return NETWORKS[this.network.chainId];
        } catch (error) {
            console.error('Failed to get signer:', error);
            throw new Error('Unable to retrieve signer account.');
        }
    }
    static async getNFTById(gameId, tokenId) {
        const signer = await this.provider.getSigner();
        // const currentProvider = new ethers.JsonRpcProvider(rpcUrls);
        const chainId = this.network.chainId;
        const contract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
            (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
            signer
        );
        const res = await contract.getNFTById(gameId, tokenId);
        console.log(res);
        return res;
    }
    static async getBorrowedNFTs() {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const lendingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFTLending_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFTLending_contract.json`)).abi,
                signer
            );
            console.log(Math.floor(Date.now() / 1000));
            const res = await lendingContract.getBorrowedNFTs(signer.address, Math.floor(Date.now() / 1000));
            return res;
        } catch (e) {
            throw new Error(e);
        }
    }
    static async getMyNFT(gameId) {
        console.log(gameId)
        const signer = await this.provider.getSigner();
        const chainId = this.network.chainId;
        const contract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
            (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
            signer
        );
        const res = await contract.getMyTokens(gameId, signer.address);
        console.log(res)
        return res;
    }

    static async getFormattedEther(price) {
        return await formatEther(price);
    }

    static async hasPurchasedGame(gameId, chainId, rpcUrls) {
        console.log(gameId, chainId, rpcUrls)
        try {
            const signer = await this.getSignerAccount();
            const currentProvider = new ethers.JsonRpcProvider(rpcUrls);
            const gamingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Games_address.json`)).address,
                (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
                currentProvider
            );

            const purchased = await gamingContract.hasPurchased(gameId, signer.address);
            return purchased;
            // allGames = allGames.concat(games);
        } catch (error) {
            // console.error(`Error fetching games from ${network.chainName}:`, error);
        }
    }

}
