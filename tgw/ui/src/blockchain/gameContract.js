import { ethers, formatEther, verifyMessage, parseEther, parseUnits } from 'ethers';
import { NETWORKS } from './networks';
import ProviderService from './providerService';

export default class GameContract {
    static async getAllGames() {
        try {
            let allGames = {};
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

    static async getGameId() {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
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

    static async crossChainGameCreation(data) {
        try {
            console.log(data);
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
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

    static async sameChainGameCreation(data) {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
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
    static sameChainBuyGame = async (gameId, price) => {
        try{
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            const contract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Games_address.json`)).address,
                (await import(`./contractsData/${chainId}_Games_contract.json`)).abi,
                signer
            );
            const res = await contract.buyGame(gameId, signer.address, { value: parseEther(price) });
            return res;

        }
        catch(e){
            throw new Error(e)
        }
    };
    static crossChainBuyGame = async (targetChainId, receiverAddress, gameId, price, actualPrice, gasPrice) => {
        try{
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            console.log(chainId)
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
        }
        catch(e){
            console.log(e)
            throw new Error(e.message)
        }
    };
}
