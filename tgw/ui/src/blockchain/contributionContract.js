import { ethers, formatEther, verifyMessage } from 'ethers';
import { NETWORKS } from './networks';
import ProviderService from './providerService';

export default class ContributionContract{

    static async getOverAllContrubutions(data) {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = await ProviderService.network.chainId;
            const contributionContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contribution = await contributionContract.getOverAllContribution();
            return formatEther(contribution);
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            throw new Error(e);
        }
    }
    static async getMyContrubutions() {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            const contributionContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contribution = await contributionContract.getMyContribution(signer.address);
            return formatEther(contribution);
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            throw new Error(e);
        }
    }
    static async addContribution(price) {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            const contributionContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const transaction = await contributionContract.addContribution({ value: ethers.parseEther(price) });
            const res = await transaction.wait();
            return res;
        } catch (e) {
            throw new Error(e);
        }
    }

    static async getAllContributions(data) {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            const contributionContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contributions = await contributionContract.getAllContributions();
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
            throw new Error(e);
        }
    }
    static async withdrawCouponValue(coupenCode) {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            const contributionContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Contribution_address.json`)).address,
                (await import(`./contractsData/${chainId}_Contribution_contract.json`)).abi,
                signer
            );
            const contributions = await contributionContract.withdrawCouponValue(coupenCode);
            const res = await contributions.wait();
            return res;
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            throw new Error(e.message);
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
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            const contributionContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Coupon_address.json`)).address,
                (await import(`./contractsData/${chainId}_Coupon_contract.json`)).abi,
                signer
            );
            const coupens = await contributionContract.getMyCoupons(signer.address);
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
            throw new Error(e);
        }
    }
    static async getCoupenValue(coupenId) {
        try {
            const signer = await ProviderService.provider.getSigner();
            const chainId = ProviderService.network.chainId;
            const contributionContract = new ethers.Contract(
                (await import(`./contractsData/${chainId}_Coupon_address.json`)).address,
                (await import(`./contractsData/${chainId}_Coupon_contract.json`)).abi,
                signer
            );
            const coupens = await contributionContract.isCouponValidAndGetAmount(signer.address, coupenId);
            return {
                valid: coupens[0],
                value: coupens[1]
            };
            // const res = await transaction.wait();
            // return res;
        } catch (e) {
            throw new Error(e);
        }
    }
}