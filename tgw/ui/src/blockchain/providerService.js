import { ethers, formatEther, verifyMessage } from 'ethers';
import Web3 from 'web3';
import { NETWORKS } from './networks';

export default class ProviderService {
    static provider = null;
    static network = null;

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
    static generateAuthenticationMessage = () => {
        const timestamp = Date.now();
        const nonce = Math.floor(Math.random() * 1000000);
        const message = 'Hi, I want to login into Theta Game World';
        return `Authentication request\n Timestamp: ${timestamp} \nNonce: ${nonce} \n Message: ${message}`;
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
    static async getFormattedEther(price) {
        return formatEther(price);
    }

}
