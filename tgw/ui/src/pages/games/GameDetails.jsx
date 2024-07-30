import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Row, Col, Button, Card, Modal, Container, Dropdown, Carousel } from 'react-bootstrap';
import { base64ToBlob, decodeNFT } from '../../helpers/helpers';
import Form from 'react-bootstrap/Form';
import InputGroup from 'react-bootstrap/InputGroup';
import BlockchainService from '../../blockchain/service';
import Accordion from 'react-bootstrap/Accordion';
import { NETWORKS } from '../../blockchain/networks';
import MintNFT from '../nfts/MintNFT';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import io from 'socket.io-client';
import Toasts from '../../components/Toasts';
import FloatingLabel from 'react-bootstrap/FloatingLabel';
import Spinners from '../../components/Spinners';
import { formatEther } from 'ethers';
import GameContract from '../../blockchain/gameContract';
const GameDetails = () => {
    const [isHovered, setIsHovered] = useState(false);

    const buttonStyle = {
        transition: 'transform 0.3s',
        transform: isHovered ? 'scale(1.2)' : 'scale(1)' // Slightly enlarge on hover
    };
    const location = useLocation();
    const serializedGame = location.state?.game; // Using optional chaining to avoid errors
    const game = serializedGame ? JSON.parse(serializedGame) : null;
    const [gameDetails, setGameDetails] = useState({});
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [allNfts, setAllNfts] = useState([]);
    const [selectedMarketPlace, setSelectedMarketPlace] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [gameRulesContent, setGameRulesContent] = useState('');
    const [gameDescriptionContent, setGameDescriptionContent] = useState('');
    const [showMintModal, setShowMintModal] = useState(false);
    const [latestPrice, setLatestPrice] = useState({});
    const latPrice = useRef('');
    const [exchangedPrice, setExchaingedPrice] = useState(1);
    const [showToast, setShowToast] = useState(false);
    const [ToastMessage, setToastMessage] = useState('');
    const [hasPurchaed, setHasPurchased] = useState(false);
    const [gasPrice, setGasPrice] = useState('');
    const [eoaBalance, setEOABalance] = useState('');
    const [coupenCode, setCoupenCode] = useState('');
    useEffect(() => {
        const socket = io(import.meta.env.VITE_APP_PRICE_SERVER);
        socket.on('connect', () => {
            console.log('Connected to the server');
        });

        socket.on('latestPrice', async data => {
            if (await BlockchainService.enableEthereum()) {
                const currentNetwork = await BlockchainService.getCurrentNetwork();
                if (game.chainId !== currentNetwork.chainId) {
                    let source = data[currentNetwork.nativeCurrency];
                    let destination = data[game.nativeCurrency];
                    console.log(destination / source);
                    setExchaingedPrice(destination / source);
                    setLatestPrice(data);
                    latPrice.current = data;
                } else {
                    setLatestPrice(data);
                }
            }
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });
        socket.emit('latestPrice');

        const initializeGameDetails = async () => {
            if (await BlockchainService.enableEthereum()) {
                const currentNetwork = await BlockchainService.getCurrentNetwork();
                setSelectedNetwork(currentNetwork);
                setSelectedMarketPlace(currentNetwork);
                console.log(game);
                setGasPrice(await BlockchainService.getGasPrice(game));
            }
            if (game) {
                setHasPurchased(await BlockchainService.hasPurchasedGame(game.gameId, game.chainId, game.rpcUrls));
                const gameAssets = game.gameAssets || {};
                if (gameAssets['gameThumbnail.png']) {
                    gameAssets['gameThumbnail.png'] = await base64ToBlob(gameAssets['gameThumbnail.png']);
                }
                if (gameAssets['gameVideo.mp4']) {
                    gameAssets['gameVideo.mp4'] = await base64ToBlob(gameAssets['gameVideo.mp4'], 'video/mp4');
                }
                if (gameAssets['gameRules.txt']) {
                    gameAssets['gameRules.txt'] = base64ToBlob(gameAssets['gameRules.txt'], 'text/plain');
                }
                if (gameAssets['gameDescription.txt']) {
                    gameAssets['gameDescription.txt'] = base64ToBlob(gameAssets['gameDescription.txt'], 'text/plain');
                }
                if (game && game.gameAssets && game.gameAssets['gameRules.txt']) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        setGameRulesContent(e.target.result);
                    };
                    reader.readAsText(game.gameAssets['gameRules.txt']);
                }
                if (game && game.gameAssets && game.gameAssets['gameDescription.txt']) {
                    const reader = new FileReader();
                    reader.onload = e => {
                        setGameDescriptionContent(JSON.stringify(e.target.result));
                    };
                    reader.readAsText(game.gameAssets['gameDescription.txt']);
                }
                console.log(game);
                setGameDetails({ ...game, gameAssets });

                if (game.chainId !== selectedNetwork.chainId) {
                    const eoaBalance = await BlockchainService.getEOABalance(game.chainId, game.rpcUrls);
                    setEOABalance(eoaBalance);
                }
            }
        };

        initializeGameDetails();
        loadNFTs();
    }, []);
    const [accountData, setAccountData] = useState({});
    const [allRawNfts, setAllRawNFTS] = useState({});
    const processNFTs = async items => {
        let allItem = [];
        const batchSize = 5; // Number of parallel fetches

        for (let i = 0; i < items.length; i += batchSize) {
            const itemBatch = items.slice(i, i + batchSize);

            const processedItems = await Promise.allSettled(
                itemBatch.map(async item => {
                    try {
                        let storekey = item.storekey;
                        let { images, metadata } = await decodeNFT(storekey, item.owner + '.zip');
                        return {
                            name: metadata.name,
                            description: metadata.description,
                            caption: metadata.captions,
                            itemId: parseInt(item.id),
                            price: await BlockchainService.getFormattedEther(item.price),
                            owner: item.owner,
                            images: images,
                            uri: storekey
                        };
                    } catch (error) {
                        console.error('Error processing NFT:', error);
                        return null; // Handle the error case, skip this item
                    }
                })
            );

            const successfulItems = processedItems
                .filter(result => result.status === 'fulfilled' && result.value !== null)
                .map(result => result.value);

            allItem.push(...successfulItems);
        }

        console.log(allItem);
        setAllNfts(allItem);
    };
    const loadNFTs = async () => {
        if (await BlockchainService.enableEthereum()) {
            try {
                const signer = await BlockchainService.getSignerAccount();
                setAccountData(signer);
                const currentNetwork = await BlockchainService.getCurrentNetwork();
                setSelectedNetwork(currentNetwork);
                const items = await BlockchainService.getAllNFTS(game.gameId);
                console.log(items);
                setAllRawNFTS(items);
                if (items) {
                    const nfts = items[currentNetwork.chainId].nfts;
                    await processNFTs(nfts);
                }
            } catch (e) {
                console.log(e.message);
            }
        }
    };

    const [showVideo, setShowVideo] = useState(false);
    const handlePlayClick = () => {
        setShowVideo(true);
    };

    const handleStopClick = () => {
        setShowVideo(false);
    };
    function formatAddress(address) {
        const maxLength = 5;
        if (address.length <= maxLength * 2 + 3) {
            return address;
        }
        const start = address.substr(0, maxLength);
        const end = address.substr(-maxLength);
        return `${start}...${end}`;
    }

    const handleChangeMarketPlace = async network => {
        if (network.chainId !== selectedNetwork.chainId) {
            console.log(latestPrice);
            let source = latestPrice[selectedNetwork.nativeCurrency];
            console.log(source);
            let destination = latestPrice[network.nativeCurrency];
            setExchaingedPrice(destination / source);
        }
        setSelectedMarketPlace(network);
        setGasPrice(await BlockchainService.getGasPrice(network));
        const nft = allRawNfts[network.chainId].nfts;
        if (nft) await processNFTs(nft);
    };

    const buyOnSameChain = async () => {
        let res;
        try {
            res = await GameContract.sameChainBuyGame(game.gameId, game.price);
            if (res.hash) {
                setIsUploading(false);
                setTransactionHash(res.hash);
                setSpinnerMessage('Purchased Successfully');
            } else {
                setSpinnerMessage(res);
            }
        } catch (e) {
            setSpinnerMessage(e.message);
        }
    };
    const buyOnCrossChain = async () => {
        try {
            let targetChainId = game.chainId;
            let receiverAddress = NETWORKS[game.chainId].gameAddress;
            const res = await GameContract.crossChainBuyGame(
                targetChainId,
                receiverAddress,
                game.gameId,
                (gameDetails.price * exchangedPrice).toFixed(10),
                gameDetails.price,
                gasPrice
            );
            if (res.hash) {
                setIsUploading(false);
                setTransactionHash(res.hash);
                setSpinnerMessage('Purchased Successfully');
            } else {
                setSpinnerMessage(res);
            }
        } catch (e) {
            setSpinnerMessage(e.message);
            // window.location.reload()
        }
    };
    const renderTooltip = props => (
        <Tooltip id='button-tooltip' {...props}>
            <div>
                <p style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{gameRulesContent}</p>
            </div>
        </Tooltip>
    );

    const [copySuccess, setCopySuccess] = useState(false);
    const [copiedId, setCopiedId] = useState('');
    const copyToClipboard = id => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setCopySuccess(true);
        setTimeout(() => {
            setCopySuccess(false);
        }, 2000); // Clear copied message after 2 seconds
    };

    const [buyGameModal, setBuyModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [spinnerMessage, setSpinnerMessage] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const buyGame = async () => {
        setIsUploading(true);
        setSpinnerMessage('Purchasing in Progress...');
        if (gameDetails.chainId === selectedNetwork.chainId) {
            buyOnSameChain();
        } else {
            buyOnCrossChain();
        }
    };

    const [buyNFTModal, setBuyNFTModal] = useState(false);
    const [selectedNFT, setSelectedNFT] = useState({});
    const handleNFTCardDetails = item => {
        setSelectedNFT(item);
        setBuyNFTModal(true);
    };
    const buyNFTOnSameChain = async () => {
        try {
            if (coupenCode) {
                const coupen = await BlockchainService.getCoupenValue(coupenCode);
                console.log(formatEther(coupen.value), selectedNFT.price)
                if(formatEther(coupen.value) > selectedNFT.price){
                    setSpinnerMessage('Coupen price is more thatn NFT price');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                    return
                }
                if (!coupen.valid) {
                    setSpinnerMessage('Coupen is Invalid');
                    setTimeout(() => {
                        window.location.reload();
                    }, 2000);
                }
                const res = await BlockchainService.buyTokenWithCoupon({
                    coupenCode: coupenCode,
                    gameId: gameDetails.gameId,
                    itemId: selectedNFT.itemId,
                    price: selectedNFT.price - formatEther(coupen.value)
                });
                if (res.hash) {
                    setIsUploading(false);
                    setTransactionHash(res.hash);
                    setSpinnerMessage('Purchased Successfully');
                } else {
                    setSpinnerMessage(res);
                }
            } else {
                const res = await BlockchainService.buyNFT({
                    coupenCode: coupenCode,
                    gameId: gameDetails.gameId,
                    itemId: selectedNFT.itemId,
                    price: selectedNFT.price
                });
                if (res.hash) {
                    setIsUploading(false);
                    setTransactionHash(res.hash);
                    setSpinnerMessage('Purchased Successfully');
                } else {
                    setSpinnerMessage(res);
                }
            }
        } catch (e) {
            setSpinnerMessage(e.message);
            // setTimeout(() => {
            //     window.location.reload()
            // }, 3000)
        }
    };

    const buyNFTOnCrossChain = async () => {
        try {
            let targetChainId = selectedMarketPlace.chainId;
            let receiverAddress = NETWORKS[selectedMarketPlace.chainId].nftAddress;
            console.log(selectedNFT.price);
            const res = await BlockchainService.crossChainBuyNFT({
                targetChainId: targetChainId,
                receiverAddress: receiverAddress,
                gameId: gameDetails.gameId,
                tokenId: selectedNFT.itemId,
                price: selectedNFT.price,
                payingAmount: (selectedNFT.price * exchangedPrice).toFixed(10),
                gasPrice: gasPrice
            });
            if (res.hash) {
                setIsUploading(false);
                setTransactionHash(res.hash);
                setSpinnerMessage('Purchased Successfully');
            } else {
                setSpinnerMessage(res);
            }
        } catch (e) {
            setSpinnerMessage(e.message);
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    };
    const buyNFT = () => {
        setIsUploading(true);
        setSpinnerMessage('Purchasing in Progress...');
        if (selectedMarketPlace.chainId === selectedNetwork.chainId) {
            buyNFTOnSameChain();
        } else {
            buyNFTOnCrossChain();
        }
    };
    return (
        <div>
            {gameDetails.gameOwner && (
                <>
                    <h1 className='text-center mb-3'>{gameDetails.gameName}</h1>
                    <div className='row'>
                        <div className='col-12'>
                            <div
                                className='card'
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    border: '0px solid #ced4da'
                                }}
                            >
                                <div className='card-body'>
                                    <div className='row'>
                                        <div className='col-lg-5'>
                                            {showVideo && gameDetails.gameAssets && gameDetails.gameAssets['gameVideo.mp4'] ? (
                                                <div className='video-container'>
                                                    <video
                                                        className='w-100'
                                                        // height='350'
                                                        controls
                                                        onEnded={handleStopClick}
                                                        style={{
                                                            borderRadius: '15px',
                                                            border: '1px solid black',
                                                            borderStyle: 'outset'
                                                        }}
                                                    >
                                                        <source src={URL.createObjectURL(gameDetails.gameAssets['gameVideo.mp4'])} type='video/mp4' />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                    <div className='d-flex justify-content-center align-items-center'>
                                                        <button className='btn btn-primary' onClick={handleStopClick}>
                                                            Stop
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                gameDetails.gameAssets &&
                                                gameDetails.gameAssets['gameThumbnail.png'] && (
                                                    <div className='video-container'>
                                                        <img
                                                            className='w-100'
                                                            style={{
                                                                // width: '500px',
                                                                height: '400px',
                                                                borderRadius: '15px',
                                                                border: '1px solid black',
                                                                borderStyle: 'outset',
                                                                opacity: '0.8'
                                                            }}
                                                            src={URL.createObjectURL(gameDetails.gameAssets['gameThumbnail.png'])}
                                                            alt='Game Thumbnail'
                                                        />
                                                        {gameDetails.gameAssets['gameVideo.mp4'] && (
                                                            <>
                                                                <div
                                                                    className='fs-3 d-flex justify-content-center align-items-center'
                                                                    onClick={handlePlayClick}
                                                                    style={{
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    ▶
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                )
                                            )}
                                        </div>
                                        <div className='col-lg-6'>
                                            <form className='ps-lg-4'>
                                                {/* <h3 className='mt-0'>{gameDetails.gameName}</h3> */}

                                                <h5 className='font-2'>Game Id:</h5>
                                                <span className='text-primary'>
                                                    {gameDetails.gameId}{' '}
                                                    {!copySuccess ? (
                                                        <i
                                                            className='bi bi-clipboard ms-1'
                                                            style={{ cursor: 'pointer' }}
                                                            onClick={() => copyToClipboard(gameDetails.gameId)}
                                                            title='Copy to Clipboard'
                                                        ></i>
                                                    ) : (
                                                        <>
                                                            {copiedId === gameDetails.gameId ? (
                                                                <i className='bi bi-clipboard-check ms-1'></i>
                                                            ) : (
                                                                <i
                                                                    className='bi bi-clipboard ms-1'
                                                                    style={{ cursor: 'pointer' }}
                                                                    onClick={() => copyToClipboard(gameDetails.gameId)}
                                                                    title='Copy to Clipboard'
                                                                ></i>
                                                            )}
                                                        </>
                                                    )}
                                                </span>

                                                <div className='mt-4'>
                                                    <h5 className='font-2'>Game Creator:</h5>
                                                    <h6>
                                                        <span className='text-primary'>{formatAddress(gameDetails.gameOwner)}</span>{' '}
                                                    </h6>
                                                </div>
                                                <div className='mt-4'>
                                                    <h5 className='font-1'>Chain:</h5>
                                                    <h6 className='text-primary'>
                                                        {' '}
                                                        <img src={gameDetails.image} className='ms-1 me-2' height={20} width={20} />
                                                        {gameDetails.chainName}
                                                    </h6>
                                                </div>
                                                <div className='mt-4 d-flex'>
                                                    <h5 className='font-1'>
                                                        NFT Name: <span className='text-primary'>{gameDetails.nftName}</span>
                                                    </h5>
                                                    <h5 className='font-1 ms-5'>
                                                        NFT Symbol: <span className='text-primary'>{gameDetails.nftSymbol}</span>
                                                    </h5>
                                                </div>

                                                <div className='mt-4'>
                                                    <h6 className='font-14'>Price:</h6>
                                                    <h3 className='text-primary'>
                                                        {' '}
                                                        {(gameDetails.price * exchangedPrice).toFixed(10)} {selectedNetwork.nativeCurrency}{' '}
                                                        {!hasPurchaed ? (
                                                            <Button
                                                                variant='success'
                                                                style={{
                                                                    width: '150px',
                                                                    left: '-100px'
                                                                }}
                                                                size='sm'
                                                                onClick={() => setBuyModal(true)}
                                                                className='mb-1 ms-5'
                                                                // disabled={selectedNetwork.chainId !== gameDetails.chainId}
                                                            >
                                                                {' '}
                                                                <span className='mdi mdi-cart me-1' /> Buy{' '}
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant='success'
                                                                className='mb-1 ms-5'
                                                                style={{
                                                                    width: '150px',
                                                                    left: '-100px'
                                                                }}
                                                                size='sm'
                                                                as='a'
                                                                href={gameDetails.gameUrl}
                                                                target='_blank'
                                                            >
                                                                {' '}
                                                                <span className='mdi mdi-cricket me-2'></span>
                                                                Play{' '}
                                                            </Button>
                                                        )}
                                                    </h3>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {gameDescriptionContent && (
                        <Accordion>
                            <Accordion.Item eventKey='0'>
                                <Accordion.Header>
                                    <h6 className='font-14'>Description:</h6>
                                </Accordion.Header>
                                <Accordion.Body>
                                    <div>
                                        <p
                                            style={{
                                                whiteSpace: 'pre-wrap',
                                                wordWrap: 'break-word'
                                            }}
                                        >
                                            {gameDescriptionContent}
                                        </p>
                                    </div>
                                    {/* {gameDetails.gameAssets && gameDetails.gameAssets['gameRules.txt'] && (
                                )} */}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    )}
                    <div className='d-flex justify-content-center align-items-center'>
                        <Button
                            variant='primary'
                            className='mt-4'
                            style={buttonStyle}
                            onMouseEnter={() => setIsHovered(true)}
                            onMouseLeave={() => setIsHovered(false)}
                            onClick={() => setShowMintModal(true)}
                            disabled={!hasPurchaed}
                        >
                            + Mint Your Creation
                        </Button>
                    </div>

                    <div className='d-flex align-items-center'>
                        <div>
                            <h4 className='mt-5'>
                                <img src={selectedMarketPlace.image} className='ms-1 me-2' height={30} width={30} />
                                {gameDetails.gameName} NFTs
                            </h4>
                        </div>
                        <div className='ms-auto'>
                            <Dropdown className='custom-dropdown float-end mt-5'>
                                <Dropdown.Toggle variant='secondary'>
                                    <img src={selectedMarketPlace.image} alt={selectedMarketPlace.chainName} className='network-image me-2' />
                                    {selectedMarketPlace.chainName}
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                                        <Dropdown.Item key={chainId} onClick={() => handleChangeMarketPlace(network)} className='mt-2'>
                                            <img src={network.image} alt={network.chainName} className='network-image me-2' />
                                            {network.chainName}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>
                        </div>
                    </div>

                    {!allNfts.length ? (
                        <div
                            style={{
                                borderStyle: 'groove',
                                borderRadius: '15px',
                                padding: '10px 10px 10px 10px'
                            }}
                        >
                            <div className='col-12 d-flex justify-content-center align-items-center'>
                                <div className='page-title-box text-center'>
                                    <img src='/src/assets/images/nft.png' />
                                    <p
                                        style={{
                                            fontSize: '25px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        No NFTs Found ...
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div
                                style={{
                                    borderStyle: 'groove',
                                    borderRadius: '15px',
                                    padding: '1px 20px 20px 20px'
                                }}
                            >
                                <Row className='justify-content-md-center mt-1'>
                                    <Col md={12}>
                                        <div className='d-flex flex-wrap '>
                                            {allNfts.map((item, index) => {
                                                if (Object.keys(item.images).length > 0) {
                                                    return (
                                                        <div key={index} className='mt-4'>
                                                            <Card className='game-card m-2' onClick={() => handleNFTCardDetails(item)}>
                                                                <Card.Img
                                                                    style={{ width: '150px', height: '150px' }}
                                                                    variant='top'
                                                                    src={item.images[0]}
                                                                    alt={item.name}
                                                                />
                                                                <Card.Body>
                                                                    <Card.Title className='text-center'>{item.name}</Card.Title>
                                                                </Card.Body>
                                                            </Card>
                                                        </div>
                                                    );
                                                }

                                                return null;
                                            })}
                                        </div>
                                    </Col>
                                </Row>
                            </div>
                        </>
                    )}
                </>
            )}

            <MintNFT show={showMintModal} handleClose={() => setShowMintModal(false)} gameId={gameDetails.gameId} />
            <Toasts show={showToast} message={ToastMessage} close={() => setShowToast(false)} />

            <Modal show={buyGameModal} size='lg'>
                <Modal.Header>
                    <Modal.Title>Buy Game</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='text-center'>
                        {gameDetails.gameAssets && gameDetails.gameAssets['gameThumbnail.png'] && (
                            <>
                                <img
                                    style={{
                                        width: '200px',
                                        height: '200px',
                                        borderRadius: '15px',
                                        border: '1px solid black',
                                        borderStyle: 'outset',
                                        opacity: '0.8'
                                    }}
                                    src={URL.createObjectURL(gameDetails.gameAssets['gameThumbnail.png'])}
                                    alt='Game Thumbnail'
                                />
                                <h3>{gameDetails.gameName}</h3>
                                <div className='mt-4'>
                                    <h5 className='font-2'>
                                        Game Id: <span className='text-primary'>{formatAddress(gameDetails.gameId)}</span>
                                    </h5>
                                </div>
                                <div className='mt-4'>
                                    <h5 className='font-2'>
                                        Game Creator: <span className='text-primary'>{formatAddress(gameDetails.gameOwner)}</span>
                                    </h5>
                                </div>
                                <div className='mt-4'>
                                    <h5 className='font-1'>
                                        Chain:
                                        <span className='text-primary'>
                                            <img src={gameDetails.image} className='ms-1' height={30} width={40} />
                                            {gameDetails.chainName}
                                        </span>{' '}
                                    </h5>
                                </div>
                                <div className='mt-4'>
                                    <h5 className='font-2'>
                                        Actual Game Price:{' '}
                                        <span className='text-primary'>
                                            {game.price} {gameDetails.nativeCurrency}
                                        </span>
                                    </h5>
                                </div>
                                <div className='mt-4'>
                                    <h5 className='font-2'>
                                        Converted Price:{' '}
                                        <span className='text-primary'>
                                            {(exchangedPrice * game.price).toFixed(10)} {selectedNetwork.nativeCurrency} 
                                        </span>
                                    </h5>
                                </div>
                            </>
                        )}
                    </div>
                    {gameDetails.chainId !== selectedNetwork.chainId && (
                        <>
                            <Form.Group controlId='formFile' className='mb-3' style={{ width: '200px' }}>
                                <Form.Label>Gas Price in GWEI (Optional)</Form.Label>
                                <Form.Control type='text' name='gasPrice' value={gasPrice} onChange={e => setGasPrice(e.target.value)} />
                            </Form.Group>
                            <h6>Price Conversion:</h6>
                            <div>
                                {selectedNetwork.chainName}'s Price:{' '}
                                <span className='text-primary'>{latestPrice[selectedNetwork.nativeCurrency]} USD</span>
                            </div>
                            <div>
                                {gameDetails.chainName}'s Price: <span className='text-primary'>{latestPrice[gameDetails.nativeCurrency]} USD</span>
                            </div>
                            <div>
                                Conversion Price is :{' '}
                                <span className='text-success'>
                                    {' '}
                                    {exchangedPrice * gameDetails.price} {selectedNetwork.nativeCurrency}{' '}
                                </span>
                                (sourceChain / destinationChain * actualPrice)
                            </div>
                            <div className='text-center text-success mt-4'>
                                <h5>You are allowed to Spend {(eoaBalance * 2) / 100}</h5>
                            </div>
                            <p className='text-center'>
                                This is calculated according to the{' '}
                                <a href='/main/contribution' target='_blank' style={{ textDecoration: 'underline' }}>
                                    available contributed amount
                                </a>
                                (2 %)
                            </p>
                        </>
                    )}
                    <div className='d-flex justify-content-center align-items-center'>
                        <Spinners on={isUploading} />
                        <h5 className='ms-2'>
                            {transactionHash && <img src='/src/assets/images/thumbsup.svg' height={30} width={40} className='mb-2' />}
                            {spinnerMessage}
                        </h5>
                    </div>
                    <div>
                        {transactionHash && (
                            <>
                                <a
                                    style={{ cursor: 'pointer', textDecoration: 'none' }}
                                    onMouseOver={e => (e.target.style.textDecoration = 'underline')}
                                    onMouseOut={e => (e.target.style.textDecoration = 'none')}
                                    href={
                                        gameDetails.chainId !== selectedNetwork.chainId
                                            ? '/main/explorer/' + transactionHash
                                            : selectedNetwork.explorer + transactionHash
                                    }
                                    target='_blank'
                                    className='text-center'
                                >
                                    <h6 className='text-primary mt-2'>
                                        {transactionHash} <span className='mdi mdi-open-in-new'></span>
                                    </h6>
                                </a>
                            </>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant='success'
                        onClick={buyGame}
                        // disabled={gameDetails.chainId !== selectedNetwork.chainId && (eoaBalance * 2) / 100 < exchangedPrice * game.price}
                        disabled={(eoaBalance * 2) / 100 < exchangedPrice * game.price}
                    >
                        <span className='mdi mdi-cart'></span> Buy
                    </Button>
                    <Button variant='secondary' onClick={() => window.location.reload()}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={buyNFTModal} size='lg'>
                <Modal.Header>
                    <Modal.Title>Buy NFT</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedNFT.images && (
                        <>
                            <Container>
                                <Row>
                                    <Col>
                                        <Carousel>
                                            {selectedNFT.images.map((image, index) => (
                                                <Carousel.Item key={index}>
                                                    <div className='image-container text-center'>
                                                        <img
                                                            // className="d-block w-100"
                                                            src={image}
                                                            alt={`Image ${index + 1}`}
                                                            width={600}
                                                            height={500}
                                                        />
                                                        <Carousel.Caption>
                                                            <h3 className='text-black'>{selectedNFT.caption[index]}</h3>
                                                        </Carousel.Caption>
                                                    </div>
                                                </Carousel.Item>
                                            ))}
                                        </Carousel>
                                    </Col>
                                </Row>
                            </Container>
                            <Container>
                                <Row>
                                    {/* {selectedNFT.images.map((image, index) => (
                                    <Col key={index}>
                                        <div className='image-container text-center'>
                                            <img src={image} alt={`Image ${index + 1}`} width={200} height={200} />
                                            <h3>{selectedNFT.caption[index]}</h3>
                                        </div>
                                    </Col>
                                ))} */}
                                </Row>
                                <h4 className='text-center mt-5'>
                                    {selectedNFT.description} - {selectedNFT.images.length} images
                                </h4>
                                <h3 className='text-center mt-3'>
                                    Price: {selectedNFT.price} {selectedMarketPlace.nativeCurrency}
                                </h3>
                                {selectedMarketPlace.chainId === selectedNetwork.chainId && (
                                    <Row className='justify-content-md-center mt-3'>
                                        <Col md={6}>
                                            <FloatingLabel controlId='floatingPassword' label='Coupen Code (Optional)'>
                                                <Form.Control
                                                    type='text'
                                                    placeholder='Coupen Code'
                                                    value={coupenCode}
                                                    onChange={e => setCoupenCode(e.target.value)}
                                                />
                                            </FloatingLabel>
                                        </Col>
                                    </Row>
                                )}
                            </Container>
                        </>
                    )}
                    {selectedMarketPlace.chainId !== selectedNetwork.chainId && (
                        <>
                            <Form.Group controlId='formFile' className='mb-3' style={{ width: '200px' }}>
                                <Form.Label>Gas Price in GWEI (Optional)</Form.Label>
                                <Form.Control type='text' name='gasPrice' value={gasPrice} onChange={e => setGasPrice(e.target.value)} />
                            </Form.Group>
                            <h6>Price Conversion:</h6>
                            <div>
                                {selectedNetwork.chainName}'s Price:{' '}
                                <span className='text-primary'>{latestPrice[selectedNetwork.nativeCurrency]} USD</span>
                            </div>
                            <div>
                                {gameDetails.chainName}'s Price:{' '}
                                <span className='text-primary'>{latestPrice[selectedMarketPlace.nativeCurrency]} USD</span>
                            </div>
                            <div>
                                Conversion Price is :{' '}
                                <span className='text-success'>
                                    {' '}
                                    {exchangedPrice * selectedNFT.price} {selectedNetwork.nativeCurrency}{' '}
                                </span>
                                (sourceChain / destinationChain * actualPrice)
                            </div>
                            <div className='text-center text-success mt-4'>
                                <h5>You are allowed to Spend {(eoaBalance * 2) / 100}</h5>
                                <p>
                                    This is calculated according to the{' '}
                                    <a href='/main/contribution' target='_blank'>
                                        available contributed amount
                                    </a>
                                    (2 %) .
                                </p>
                            </div>
                        </>
                    )}
                    <div className='d-flex justify-content-center align-items-center'>
                        <Spinners on={isUploading} />
                        <h5 className='ms-2'>
                            {transactionHash && <img src='/src/assets/images/thumbsup.svg' height={30} width={40} className='mb-2' />}
                            {spinnerMessage}
                        </h5>
                    </div>
                    <div>
                        {transactionHash && (
                            <>
                                <a
                                    style={{ cursor: 'pointer', textDecoration: 'none' }}
                                    onMouseOver={e => (e.target.style.textDecoration = 'underline')}
                                    onMouseOut={e => (e.target.style.textDecoration = 'none')}
                                    href={
                                        selectedMarketPlace.chainId !== selectedNetwork.chainId
                                            ? '/main/explorer/' + transactionHash
                                            : selectedNetwork.explorer + transactionHash
                                    }
                                    target='_blank'
                                    className='text-center'
                                >
                                    <h6 className='text-primary mt-2'>
                                        {transactionHash} <span className='mdi mdi-open-in-new'></span>
                                    </h6>
                                </a>
                            </>
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    {!transactionHash && (
                        <Button
                            variant='success'
                            onClick={buyNFT}
                            disabled={(eoaBalance * 2) / 100 < exchangedPrice * selectedNFT.price}
                            // disabled={
                            //     selectedMarketPlace.chainId !== selectedNetwork.chainId
                            // }
                        >
                            <span className='mdi mdi-cart'></span> Buy
                        </Button>
                    )}
                    <Button variant='secondary' onClick={() => setBuyNFTModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default GameDetails;
