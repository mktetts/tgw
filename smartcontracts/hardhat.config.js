require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: "0.8.19",
    networks: {
        gnosis: {
            url: process.env.GNOSIS_CHIADO_TESTNET_RPC_URL,
            accounts: [process.env.PRIVATE_KEY_10200],
            chainId: 10200
        },
        theta: {
            url: process.env.THETA_TESTNET_RPC_URL,
            accounts: [process.env.PRIVATE_KEY_365],
            chainId: 365
        },
        base:{
            url: process.env.BASE_SEPOLIA_RPC_URL,
            accounts:[process.env.PRIVATE_KEY_84532],
            chainId: 84532
        },
        sepolia:{
            url: process.env.ETHEREUM_SEPOLIA_RPC_URL,
            accounts:[process.env.PRIVATE_KEY_11155111],
            chainId: 11155111
        },
        amoy:{
            url: process.env.POLYGON_AMOY_RPC_URL,
            accounts:[process.env.PRIVATE_KEY_80002],
            chainId: 80002
        },
        arbitrum:{
            url: process.env.ARBITRUM_SEPOLIA_RPC_URL,
            accounts:[process.env.PRIVATE_KEY_421614],
            chainId: 421614
        }
    },
};
