const hre = require("hardhat");
const fs = require("fs");
require("dotenv").config();

const NETWORKS = require("../constants.js");
async function main() {
    const networkName = hre.network.name;
    // console.log(networkName)
    // console.log(NETWORKS[networkName])

    const networkConfig = hre.config.networks[networkName];
    let nftAddress, gameAddress, contributionAddress, offChainAddress, onChainAddress, feesAddress, coupenAddress, nftLendingAddress;

    const Coupon = await hre.ethers.getContractFactory("Coupon");
    let coupon = await Coupon.deploy();
    console.log("Coupon contract address:", coupon.target);
    coupenAddress = coupon.target
    moveContractFiles(coupon, "Coupon", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));

    const Contribution = await hre.ethers.getContractFactory("Contribution");
    let relayerContribution = await Contribution.deploy(coupenAddress);
    console.log("Contribution contract address:", relayerContribution.target);
    contributionAddress = relayerContribution.target
    moveContractFiles(relayerContribution, "Contribution", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));

    const NFT = await hre.ethers.getContractFactory("NFT");
    let nft = await NFT.deploy(coupenAddress);
    console.log("NFT contract address:", nft.target);
    nftAddress = nft.target
    moveContractFiles(nft, "NFT", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));

    const Games = await hre.ethers.getContractFactory("Games");
    let games = await Games.deploy();
    console.log("Games contract address:", games.target);
    gameAddress = games.target
    moveContractFiles(games, "Games", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));
    
    const NFTLending = await hre.ethers.getContractFactory("NFTLending");
    let nftLending = await NFTLending.deploy(nftAddress);
    console.log("NFTLending contract address:", nftLending.target);
    nftLendingAddress = nftLending.target
    moveContractFiles(nftLending, "NFTLending", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));

    const OffChain = await hre.ethers.getContractFactory("OffChain");
    let offChain = await OffChain.deploy();
    console.log("OffChain contract address:", offChain.target);
    offChainAddress = offChain.target
    moveContractFiles(offChain, "OffChain", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));

    const FeeCollector = await hre.ethers.getContractFactory("FeeCollector");
    let fees = await FeeCollector.deploy(process.env[`EOA_ACCOUNT_${networkConfig.chainId}`]);
    console.log("FeeCollector contract address:", fees.target);
    feesAddress = fees.target
    moveContractFiles(fees, "FeeCollector", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));

    const OnChain = await hre.ethers.getContractFactory("OnChain");
    let onChain = await OnChain.deploy(feesAddress);
    console.log("OnChain contract address:", onChain.target);
    onChainAddress = onChain.target
    moveContractFiles(onChain, "OnChain", networkConfig.chainId);
    await new Promise(r => setTimeout(r, 10000));

    const Messaging = await hre.ethers.getContractFactory("Messaging");
    let messaging = await Messaging.deploy(onChainAddress, nftAddress, gameAddress);
    console.log("Messaging contract address:", messaging.target);
    moveContractFiles(messaging, "Messaging", networkConfig.chainId);
    // await new Promise(r => setTimeout(r, 10000));

}

function moveContractFiles(contract, name, chainId) {
    const contractsDir = "../theta-gaming/ui/src/blockchain/contractsData/";

    if (!fs.existsSync(contractsDir)) {
        fs.mkdirSync(contractsDir);
    }

    fs.writeFileSync(
        contractsDir + `/${chainId}_${name}_address.json`,
        JSON.stringify({ address: contract.target }, undefined, 2)
    );

    const contractArtifact = artifacts.readArtifactSync(name);

    fs.writeFileSync(
        contractsDir + `/${chainId}_${name}_contract.json`,
        JSON.stringify(contractArtifact, null, 2)
    );
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
