export const NETWORKS = {
    365: {
        chainId: 365,
        chainName: "Theta Testnet",
        rpcUrls: "https://eth-rpc-api-testnet.thetatoken.org/rpc",
        nativeCurrency: "TFUEL",
        image: "/src/assets/images/theta.svg",
        explorer: "https://testnet-explorer.thetatoken.org/txs/",
        cexplorer: "https://testnet-explorer.thetatoken.org/account/",
        nftAddress:'0x7FBf88EB6c04faBcbCDC0E1BD96888d7C27353Cc',
        gameAddress:'0x8506FcE859341A2BF20a9d5B62Ea8e6784C2cdC9',
        onChainAddress:'0xfCDBed330007f3ae4957C7089793CE62f63A87f9',
    },
    11155111: {
        chainId: 11155111,
        chainName: "Sepolia Testnet",
        rpcUrls: "https://ethereum-sepolia-rpc.publicnode.com",
        nativeCurrency: "ETH",
        image: "/src/assets/images/ethereum.svg",
        explorer: "https://sepolia.etherscan.io/tx/",
        cexplorer: "https://sepolia.etherscan.io/address/",
        nftAddress:'0xFA10087fA507dbED5A1e28dD26F1c75BC695cF58',
        gameAddress:'0x0a03B32fB6E71D6c92aCD1BE5c3f0c5C4082545f',
        onChainAddress:'0xce88047d4F74e94eBB850589eb6b43505e99e8fd',
    },
    421614: {
        chainId: 421614,
        chainName: "Arbitrum Sepolia Testnet",
        rpcUrls: "https://sepolia-rollup.arbitrum.io/rpc",
        explorer: "https://ccip.chain.link/msg/",
        nativeCurrency: "ETH",
        image: "/src/assets/images/arbitrum.svg",
        explorer: "https://sepolia.arbiscan.io/tx/",
        cexplorer: "https://sepolia.arbiscan.io/address/",
        nftAddress:'0x0B0B5939eFe118519c1608f31102d7DCbBb42831',
        gameAddress:'0xFA10087fA507dbED5A1e28dD26F1c75BC695cF58',
        onChainAddress:'0xe54627cC49699B15698d4D80721d8ea61bFF992e'
    },
    84532: {
        chainId: 84532,
        chainName: "Base Sepolia Testnet",
        rpcUrls: "https://sepolia.base.org",
        nativeCurrency: "ETH",
        image: "/src/assets/images/base.svg",
        explorer: "https://sepolia.basescan.org/tx/",
        cexplorer: "https://sepolia.basescan.org/address/",
        nftAddress:'0x92530cCBA6E15866EE2f9E9df9bBcbeCADeB4243',
        gameAddress:'0xf8974fd417cDcC9d5Cadf61F35228a18D7784bF0',
        onChainAddress:'0x0098b9724C595D76B032a9D5B01b5D1d7Bc34Fb3'
    },
    80002: {
        chainId: 80002,
        chainName: "Polygon Amoy Testnet",
        rpcUrls: "https://rpc-amoy.polygon.technology",
        nativeCurrency: "MATIC",
        image: "/src/assets/images/polygon.svg",
        explorer: "https://www.oklink.com/amoy/tx/",
        cexplorer: "https://www.oklink.com/amoy/address/",
        nftAddress:'0x405cbdbA7C7F006AE9fC5ad952b2d3DDd2aeb0E9',
        gameAddress:'0x07F539B5cCF429EB1490BF404904c066d41b66A4',
        onChainAddress:'0xD88Faf7A4107587d8D9859d5209ce75419482689'
    },
    10200: {
        chainId: 10200,
        chainName: "Gnosis Chiado Testnet",
        rpcUrls: "https://gnosis-chiado-rpc.publicnode.com/",
        nativeCurrency: "XDAI",
        image: "/src/assets/images/gnosis-chain.svg",
        explorer: "https://gnosis-chiado.blockscout.com/tx/",
        cexplorer: "https://gnosis-chiado.blockscout.com/address/",
        nftAddress:'0x3496b0a8809E8a8f2277a7073154fF1e85514c1D',
        gameAddress:'0xb5F68EB4baD78B050DB55DCb02FCC30815B477ea',
        onChainAddress:'0xAC0C8Aa0324E4d4ff1170ba4291C17684B4E7ecE',
    },
}


// ************** Gnosis ****************

// Coupon contract address: 0xFb1409344A636F6f9d40eE20473743b42Db142D9
// Contribution contract address: 0x34ACE2F0cfeB0d3741B7dAC5F013c72cd580cebc
// NFT contract address: 0x3496b0a8809E8a8f2277a7073154fF1e85514c1D
// Games contract address: 0xb5F68EB4baD78B050DB55DCb02FCC30815B477ea
// NFTLending contract address: 0x20F1f6104FAC6eA8b38C6f1e0ed06df35716553a
// OffChain contract address: 0x66610Ed3C3CfD75d6e49d92AEaf258D9D2FC78DE
// FeeCollector contract address: 0x34072c72Fd0932F327976d55F030E9aD80799329
// OnChain contract address: 0xAC0C8Aa0324E4d4ff1170ba4291C17684B4E7ecE
// Messaging contract address: 0x00c07E165A65B0132f5FF263363A2FcB80E060aA


// ************** Amoy ****************

// Coupon contract address: 0xF1b35AE8250eC1901b04b25649db3938F0C8dfe1
// Contribution contract address: 0x174Dc96A7Db75119784076f083904Ff531FA2910
// NFT contract address: 0x405cbdbA7C7F006AE9fC5ad952b2d3DDd2aeb0E9
// Games contract address: 0x07F539B5cCF429EB1490BF404904c066d41b66A4
// NFTLending contract address: 0x268765515F08E1a9869C07C27eBefD4E69048884
// OffChain contract address: 0xC463BD08bb40D9e0a0F3c7B1c9Ad24754BAd8A23
// FeeCollector contract address: 0xAb7b97D145191a3360cbcd6f78f9a99C6b53C23B
// OnChain contract address: 0xD88Faf7A4107587d8D9859d5209ce75419482689
// Messaging contract address: 0x635Bbb2D4b5fa6eb2D303a2af72624f22cfE7FD4

// ************** Arbitrum ****************

// Coupon contract address: 0x3A8dd6cD875fFeA174503Bf89Bbd4962643329DD
// Contribution contract address: 0xE0bB71aE2445C79eEeaCF540D2503D4819E6e10b
// NFT contract address: 0x0B0B5939eFe118519c1608f31102d7DCbBb42831
// Games contract address: 0xFA10087fA507dbED5A1e28dD26F1c75BC695cF58
// NFTLending contract address: 0x0a03B32fB6E71D6c92aCD1BE5c3f0c5C4082545f
// OffChain contract address: 0x600EBB34840a167F4a6ab17e32DA899687a3a79a
// FeeCollector contract address: 0x7Bb165B7D69485A520984EE7369d410e8f7260E2
// OnChain contract address: 0xe54627cC49699B15698d4D80721d8ea61bFF992e
// Messaging contract address: 0xce88047d4F74e94eBB850589eb6b43505e99e8fd



// ************** Base ****************
// Coupon contract address: 0x82874Aa6db451459739396f3d340E06baf5aDfE6
// Contribution contract address: 0x2A48a2504b6831e86A89991Cf71AFD8574f8383e
// NFT contract address: 0x92530cCBA6E15866EE2f9E9df9bBcbeCADeB4243
// Games contract address: 0xf8974fd417cDcC9d5Cadf61F35228a18D7784bF0
// NFTLending contract address: 0x495B97AA35dC152C63662640B1A9e34C261f4cda
// OffChain contract address: 0xD9A377f073E0DF0BEC7F94Cf718bB7ff5d824A34
// FeeCollector contract address: 0x9D37c91A7bd18EC6f72128D0730e734a792b6377
// OnChain contract address: 0x0098b9724C595D76B032a9D5B01b5D1d7Bc34Fb3
// Messaging contract address: 0x3A8dd6cD875fFeA174503Bf89Bbd4962643329DD


// ************** Sepolia ****************

// Coupon contract address: 0xE0bB71aE2445C79eEeaCF540D2503D4819E6e10b
// Contribution contract address: 0x0B0B5939eFe118519c1608f31102d7DCbBb42831
// NFT contract address: 0xFA10087fA507dbED5A1e28dD26F1c75BC695cF58
// Games contract address: 0x0a03B32fB6E71D6c92aCD1BE5c3f0c5C4082545f
// NFTLending contract address: 0x600EBB34840a167F4a6ab17e32DA899687a3a79a
// OffChain contract address: 0x7Bb165B7D69485A520984EE7369d410e8f7260E2
// FeeCollector contract address: 0xe54627cC49699B15698d4D80721d8ea61bFF992e
// OnChain contract address: 0xce88047d4F74e94eBB850589eb6b43505e99e8fd
// Messaging contract address: 0x64371f372D372315c56C6E09Cb8aC230dc365B48

// ************** Theta ****************

// Coupon contract address: 0x991Ee2Ad6400e2C7681fa052bEe20900e6368b9D
// Contribution contract address: 0x65C525da23480144aB86FeD969Fe121880BdcFBd
// NFT contract address: 0x7FBf88EB6c04faBcbCDC0E1BD96888d7C27353Cc
// Games contract address: 0x8506FcE859341A2BF20a9d5B62Ea8e6784C2cdC9
// NFTLending contract address: 0x4650F931A1b0a7B9EA8e8933e5Cc5c1CF260272F
// OffChain contract address: 0x3504a02093096D5a6Be2B6Cf38F039613F1eFe6D
// FeeCollector contract address: 0x7a9F0c075DF9D6b94AD61b12BB219F12Ca9c1A68
// OnChain contract address: 0xfCDBed330007f3ae4957C7089793CE62f63A87f9
// Messaging contract address: 0xD3e01e843FDE41590CDf4ded06A987C353d6aCA1
