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

    static async getAllContributions(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_RelayerContribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_RelayerContribution_contract.json`)).abi,
                signer
            );
            const contributions = await relayerContract.getAllContributions();
            let items = [];
            for (let i = 0; i < contributions.length; i++) {
                let timestamp = parseInt(contributions[i].timestamp);
                const date = new Date(timestamp * 1000);
                items.push({
                    contributor: contributions[i].contributor,
                    value: formatEther(contributions[i].value),
                    timestamp: date
                });
            }
            return items;
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async withdrawCouponValue(coupenCode) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contributions = await relayerContract.withdrawCouponValue(coupenCode);
            const res = await contributions.wait();
            return res;
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static formatId(address) {
        const maxLength = 10;
        if (address.length <= maxLength * 2 + 3) {
            return address;
        }
        const start = address.substr(0, maxLength);
        const end = address.substr(-maxLength);
        return `${start}...${end}`;
    }
    static async getMyCoupons(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Coupen_address.json`)).address,
                (await import(`./contractsData/${chainId}_Coupen_contract.json`)).abi,
                signer
            );
            const coupens = await relayerContract.getMyCoupons(signer.address);
            let items = [];
            for (let i = 0; i < coupens.length; i++) {
                let timestamp = parseInt(coupens[i].timestamp);
                const date = new Date(timestamp * 1000).toLocaleString();
                items.push({
                    id: coupens[i].id,
                    code: this.formatId(coupens[i].id),
                    value: formatEther(coupens[i].value),
                    timestamp: date,
                    used: coupens[i].used,
                    withdrawn: coupens[i].withdrawn
                });
            }
            console.log(items);
            return items;
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async getOverAllContrubutions(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contribution = await relayerContract.getOverAllContrubution();
            return formatEther(contribution);
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async getMyContrubutions() {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contribution = await relayerContract.getMyContribution(signer.address);
            return formatEther(contribution);
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async addContribution(price) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const transaction = await relayerContract.addContribution({ value: parseEther(price) });
            const res = await transaction.wait();
            return res;
        } catch (e) {
            throw new Error(e);
        }
    }
    static sameChainBuyGame = async (gameId, price) => {
        const signer = await this.provider.getSigner();
        const chainId = this.network.chainId;
        const contract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_Games_address.json`)).address,
            (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
            signer
        );
        const res = await contract.buyGame(gameId, signer.address, { value: parseEther(price) });
        return res;
    };
    static crossChainBuyGame = async (targetChainId, receiverAddress, gameId, price, actualPrice, gasPrice) => {
        const signer = await this.provider.getSigner();
        const chainId = this.network.chainId;

        const messagingContract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_Messaging_address.json`)).address,
            (await import(`./contractsData/${chainId}_Messaging_contract.json`)).abi,
            signer
        );
        const gasFees = await messagingContract.getFee();
        console.log(gasPrice)
        console.log(price);
        console.log(actualPrice)
        const res = await messagingContract.buyGame(
            targetChainId,
            receiverAddress,
            gameId,
            signer.address,
            parseEther(actualPrice.toString()),
            ethers.parseUnits(gasPrice, 'gwei'),
            {
                value: parseEther(price.toString()) + gasFees
            }
        );
        return res;
        // try{
        // }
        // catch(e){
        //     throw new Error(e.message)
        // }
    };
    static async sameChainGameCreation(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const gamingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Games_address.json`)).address,
                (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
                signer
            );

            const transaction = await gamingContract.addGame({
                gameId: data.gameId,
                gameOwner: data.gameOwner,
                gameName: data.gameName,
                nftName: data.nftName,
                nftSymbol: data.nftSymbol,
                price: parseEther(data.price),
                gameUrl: data.gameUrl,
                gameAssets: data.gameAssets,
                timestamp: 0
            });

            const res = await transaction.wait();
            return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async getGameId() {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const gamingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Games_address.json`)).address,
                (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
                signer
            );

            const res = await gamingContract.getGameId(parseInt(Date.now()));
            return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async getPurchasedGames() {
        try {
            let allGames = {};
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const gamingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Games_address.json`)).address,
                (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
                signer
            );

            const res = await gamingContract.getPurchasedGames();
            allGames[chainId.toString()] = {
                network: await this.getCurrentNetwork(),
                games: res
            };
            return allGames;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async crossChainGameCreation(data) {
        try {
            console.log(data);
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const messagingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Messaging_address.json`)).address,
                (await import(`./contractsData/${chainId}_Messaging_contract.json`)).abi,
                signer
            );
            const gasFees = await messagingContract.getFee();
            console.log(gasFees);
            console.log(ethers.parseUnits(data.gasPrice, 'gwei'));
            console.log(typeof data.gasPrice);
            const transaction = await messagingContract.createGame(
                data.targetChainId,
                data.receiverAddress,
                {
                    gameId: data.gameId,
                    gameOwner: data.gameOwner,
                    gameName: data.gameName,
                    nftName: data.nftName,
                    nftSymbol: data.nftSymbol,
                    price: parseEther(data.price),
                    gameUrl: data.gameUrl,
                    gameAssets: data.gameAssets,
                    timestamp: 0
                },
                ethers.parseUnits(data.gasPrice, 'gwei'),
                { value: gasFees }
            );
            console.log(transaction)
            const res = await transaction.wait();
            console.log(res)
            return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }

    static async getAllGames() {
        try {
            let allGames = {};
            let gameDetails = {};
            const gamePromises = Object.entries(NETWORKS).map(async ([chainId, network]) => {
                try {
                    const currentProvider = new ethers.JsonRpcProvider(network.rpcUrls);

                    
                    const gamingContract = new ethers.Contract(
                        (await import(`./contractsData/${chainId}_Games_address.json`)).address,
                        (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
                        currentProvider
                    );
                    
                    const games = await gamingContract.getAllGames();
                    allGames[chainId.toString()] = {
                        network: network,
                        games: games
                    };
                    // allGames = allGames.concat(games);
                } catch (error) {
                    console.log(error.message)
                    // console.error(`Error fetching games from ${network.chainName}:`, error);
                }
            });

            await Promise.all(gamePromises);
            return allGames;
        } catch (e) {
            console.log(e);
        }
    }

    static async hasPurchasedGame(gameId, chainId, rpcUrls) {
        try {
            console.log(gameId, chainId, rpcUrls )
            const signer = await this.getSignerAccount();
            const currentProvider = new ethers.JsonRpcProvider(rpcUrls);
            const gamingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Games_address.json`)).address,
                (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
                currentProvider
            );

            const purchased = await gamingContract.hasPurchased(gameId, signer.address);
            console.log(purchased)
            return purchased;
            // allGames = allGames.concat(games);
        } catch (error) {
            // console.error(`Error fetching games from ${network.chainName}:`, error);
        }
    }
    static async crossChainMintNFT(data) {
        try {
            console.log(data);
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const contract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Messaging_address.json`)).address,
                (await import(`./contractsData/${chainId}_Messaging_contract.json`)).abi,
                signer
            );
            const gasFees = await contract.getFee();
            const transaction = await contract.mintNFT(
                data.targetChainId,
                data.receiverAddress,
                data.gameId,
                data.seller,
                data.storekey,
                parseEther(data.price),
                ethers.parseUnits(data.gasPrice, 'gwei'),
                { value: gasFees }
            );

            const res = await transaction.wait();
            return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async sameChainMintNFT(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const contract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
                signer
            );
            const transaction = await contract.mint(data.seller, data.gameId, data.storekey, parseEther(data.price));

            const res = await transaction.wait();
            return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async crossChainBuyNFT(data) {
        try {
            console.log(data);
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const contract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Messaging_address.json`)).address,
                (await import(`./contractsData/${chainId}_Messaging_contract.json`)).abi,
                signer
            );
            const gasFees = await contract.getFee();
            const transaction = await contract.buyNFT(
                data.targetChainId,
                data.receiverAddress,
                data.gameId,
                data.tokenId,
                signer.address,
                parseEther(data.price.toString()),
                ethers.parseUnits(data.gasPrice, 'gwei'),
                { value: gasFees + parseEther(data.payingAmount.toString()) }
            );

            const res = await transaction.wait();
            return res;
        } catch (e) {
            throw new Error(e.message);
        }
    }

    static async getUnsoldNFT(gameId) {
        try {
            let allItems = [];
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const contract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
                signer
            );
            const res = await contract.getUnsoldTokens(gameId);
            return res;
        } catch (e) {
            console.log(e);
        }
    }

    static async getMyNFT(gameId, rpcUrls, chainId) {
        console.log(rpcUrls);
        const signer = await this.provider.getSigner();
        const currentProvider = new ethers.JsonRpcProvider(rpcUrls);
        // const chainId = this.network.chainId;
        const contract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
            (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
            currentProvider
        );
        const res = await contract.getMyTokens(gameId, signer.address);
        console.log(res);
        return res;
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

    static async getAllNFTS(gameId) {
        try {
            let allGames = {};
            let gameDetails = {};
            console.log(gameId);
            const gamePromises = Object.entries(NETWORKS).map(async ([chainId, network]) => {
                try {
                    const currentProvider = new ethers.JsonRpcProvider(network.rpcUrls);
                    const nftContract = new ethers.Contract(
                        (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
                        (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
                        currentProvider
                    );
                    console.log((await import(`./contractsData/${chainId}_NFT_address.json`)).address);
                    const nfts = await nftContract.getUnsoldTokens(gameId);
                    console.log(nfts);
                    allGames[chainId.toString()] = {
                        network: network,
                        nfts: nfts
                    };
                    // allGames = allGames.concat(games);
                } catch (error) {
                    // console.error(`Error fetching games from ${network.chainName}:`, error);
                }
            });
            console.log(allGames);
            await Promise.all(gamePromises);
            return allGames;
        } catch (e) {
            console.log(e);
        }
    }

    static async buyNFT(data) {
        const signer = await this.provider.getSigner();
        const chainId = this.network.chainId;
        const contract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
            (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
            signer
        );
        const res = await contract.buyToken(data.gameId, data.itemId, signer.address, { value: parseEther(data.price.toString()) });
        return res;
    }

    static async buyTokenWithCoupon(data) {
        console.log(data);
        const signer = await this.provider.getSigner();
        const chainId = this.network.chainId;
        const contract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
            (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
            signer
        );
        const res = await contract.buyTokenWithCoupon(data.coupenCode, data.gameId, data.itemId, signer.address, {
            value: parseEther(data.price.toString())
        });
        return res;
    }

    static async getFormattedEther(price) {
        return await formatEther(price);
    }

    static async getAllContributions(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contributions = await relayerContract.getAllContributions();
            let items = [];
            for (let i = 0; i < contributions.length; i++) {
                let timestamp = parseInt(contributions[i].timestamp);
                const date = new Date(timestamp * 1000);
                items.push({
                    contributor: contributions[i].contributor,
                    value: formatEther(contributions[i].value),
                    timestamp: date
                });
            }
            return items;
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static formatId(address) {
        const maxLength = 10;
        if (address.length <= maxLength * 2 + 3) {
            return address;
        }
        const start = address.substr(0, maxLength);
        const end = address.substr(-maxLength);
        return `${start}...${end}`;
    }
    static async getMyCoupons(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Coupon_address.json`)).address,
                (await import(`./contractsData/${chainId}_Coupon_contract.json`)).abi,
                signer
            );
            const coupens = await relayerContract.getMyCoupons(signer.address);
            let items = [];
            for (let i = 0; i < coupens.length; i++) {
                let timestamp = parseInt(coupens[i].timestamp);
                const date = new Date(timestamp * 1000).toLocaleString();
                items.push({
                    id: coupens[i].id,
                    code: this.formatId(coupens[i].id),
                    value: formatEther(coupens[i].value),
                    timestamp: date,
                    used: coupens[i].used,
                    withdrawn: coupens[i].withdrawn
                });
            }
            return items;
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }
    static async getOverAllContrubutions(data) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contribution = await relayerContract.getOverAllContribution();
            return formatEther(contribution);
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }

    static async getGasPrice(network) {
        const currentProvider = new ethers.JsonRpcProvider(network.rpcUrls);
        const gasPrice = (await currentProvider.getFeeData()).gasPrice;
        return formatUnits(gasPrice, 9);
    }

    static teleportNFT = async (targetChainId, receiverAddress, gameId, itemId, price, gasPrice) => {
        const signer = await this.provider.getSigner();
        const chainId = this.network.chainId;
        console.log(signer);
        // console.log(itemId)
        const messagingContract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_Messaging_address.json`)).address,
            (await import(`./contractsData/${chainId}_Messaging_contract.json`)).abi,
            signer
        );
        const gasFees = await messagingContract.getFee();
        console.log(price);
        const res = await messagingContract.teleportNFT(
            targetChainId,
            receiverAddress,
            gameId,
            itemId,
            signer.address,
            parseEther(price.toString()),
            ethers.parseUnits(gasPrice, 'gwei'),
            {
                value: gasFees
            }
        );
        let tx = res.wait();
        return tx;
        // try{
        // }
        // catch(e){
        //     throw new Error(e.message)
        // }
    };
    static async getEOABalance(chainId, rpcUrls) {
        const currentProvider = new ethers.JsonRpcProvider(rpcUrls);
        const contract = new ethers.Contract(
            (await import(`./contractsData/${chainId}_FeeCollector_address.json`)).address,
            (await import(`./contractsData/${chainId}_FeeCollector_contract.json`)).abi,
            currentProvider
        );
        const eoa = await contract.getEOA();
        const balance = await currentProvider.getBalance(eoa);
        console.log(balance);
        return formatEther(balance);
    }

    static async getCoupenValue(coupenId) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const relayerContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Coupon_address.json`)).address,
                (await import(`./contractsData/${chainId}_Coupon_contract.json`)).abi,
                signer
            );
            const coupens = await relayerContract.isCouponValidAndGetAmount(signer.address, coupenId);
            return {
                valid: coupens[0],
                value: coupens[1]
            };
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            console.log(e);
            return e.message;
        }
    }

    static async lendNFT(tokenId, lendingAmount, duration, gameId, gameName) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const lendingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFTLending_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFTLending_contract.json`)).abi,
                signer
            );
            const transaction = await lendingContract.lendNFT(tokenId, parseEther(lendingAmount.toString()), duration, gameId, gameName);

            const res = await transaction.wait();
            return res;
        } catch (e) {
            throw new Error(e);
        }
    }

    static async getActiveLendings() {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const lendingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFTLending_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFTLending_contract.json`)).abi,
                signer
            );
            const res = await lendingContract.getActiveLendings();
            return res;
        } catch (e) {
            throw new Error(e);
        }
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

    static async retriveNFT(lendingId) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const lendingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFTLending_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFTLending_contract.json`)).abi,
                signer
            );
            const res = await lendingContract.retrieveNFT(lendingId);
            return res;
        } catch (e) {
            throw new Error(e);
        }
    }
    static async rentNFT(lendingId, price) {
        try {
            const signer = await this.provider.getSigner();
            const chainId = this.network.chainId;
            const lendingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFTLending_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFTLending_contract.json`)).abi,
                signer
            );
            console.log(lendingId, price);
            const res = await lendingContract.rentNFT(lendingId, { value: parseEther(price.toString()) });
            return res;
        } catch (e) {
            console.log(e);
            throw new Error(e);
        }
    }

    static async getLockedTokens(gameId) {
        try {
            const signer = await this.provider.getSigner();

            const chainId = this.network.chainId;
            const lendingContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_NFT_address.json`)).address,
                (await import(`./contractsData/${chainId}_NFT_contract.json`)).abi,
                signer
            );
            console.log(gameId);
            const res = await lendingContract.getLockedTokens(gameId);
            console.log(res);
            return res;
        } catch (e) {
            throw new Error(e);
        }
    }

    static getMyBalance = async () => {
        const signer = await this.provider.getSigner();
        const balance = await this.provider.getBalance(signer.address);
        return await this.getFormattedEther(balance)
    };
    static donate = async (recipient, amount) => {
        const signer = await this.provider.getSigner();
        const tx = {
            to: recipient,
            value: ethers.parseEther(amount.toString())
        };
        try {
            const transactionResponse = await signer.sendTransaction(tx);
            const receipt = await transactionResponse.wait();
            return { message: 'Successfully Doanted..' };
        } catch (error) {
            console.log('Error sending transaction:', error);
        }
    };

    static getGwei = (price) =>{
        return (ethers.formatUnits(price, 'gwei')).toString();
    }
}
