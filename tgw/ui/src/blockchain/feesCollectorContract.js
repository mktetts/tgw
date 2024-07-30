import { ethers, formatEther, verifyMessage } from 'ethers';
import { NETWORKS } from './networks';
import ProviderService from './providerService';

export default class FeesCollectorContract {
    static async getEOABalance(chainId, rpcUrls) {
        try{
            const currentProvider = new ethers.JsonRpcProvider(rpcUrls);
            const contract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_FeeCollector_address.json`)).address,
                (await import(`./contractsData/${chainId}_FeeCollector_contract.json`)).abi,
                currentProvider
            );
            const eoa = await contract.getEOA();
            const balance = await currentProvider.getBalance(eoa);
            return ProviderService.getFormattedEther(balance);
        }
        catch(e){
            throw new Error(e)
        }
    }
}
