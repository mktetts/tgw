import React, { useState, useEffect } from 'react';
import BlockchainService from '../../blockchain/service';
import { convertBlobToBase64, decodeNFT, unZipGamingAssets } from '../../helpers/helpers';
import { GAMEIMAGES } from '../games/images';
import { Button, Carousel, Container, Dropdown, Form, Modal } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Card, Col, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { NETWORKS } from '../../blockchain/networks';
import Accordion from 'react-bootstrap/Accordion';
import io from 'socket.io-client';
import Spinners from '../../components/Spinners';

function MyAssets() {
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [selectedMarketPlace, setSelectedMarketPlace] = useState({});
    const [allGames, setAllGames] = useState([]);
    const navigate = useNavigate();
    const [allRawNfts, setAllRawNFTS] = useState({});
    const [allNfts, setAllNfts] = useState([]);
    const [seletedItem, setSelectedItem] = useState({});
    const [accountData, setAccountData] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [gasPrice, setGasprice] = useState('');
    const [latestPrice, setLatestPrice] = useState({});
    const [exchangedPrice, setExchaingedPrice] = useState('');
    const [livePrice, setLivePrice] = useState(0);
    const [days, setDays] = useState('');
    const [hours, setHours] = useState('');
    const [minutes, setMinutes] = useState('');
    const [seconds, setSeconds] = useState('');
    const [totalSeconds, setTotalSeconds] = useState(null);
    const [tab, setTab] = useState('teleport');
    useEffect(() => {
        init();
        const socket = io(import.meta.env.VITE_APP_PRICE_SERVER);
        socket.on('connect', () => {
            socket.emit('latestPrice');
            console.log('Connected to the price server');
        });

        socket.on('latestPrice', async data => {
            setLatestPrice(data);
        });

        socket.on('disconnect', () => {
            console.log('Disconnected from the server');
        });
    }, []);
    const [selectedGame, setSelectedGame] = useState({});

    const [allRawGames, setAllRawGames] = useState('');
    const processGame = async games => {
        let allGame = [];
        const batchSize = 5; // Number of parallel fetches
        try{
            for (let i = 0; i < games.length; i += batchSize) {
                const gameBatch = games.slice(i, i + batchSize);
    
                const processedGames = await Promise.allSettled(
                    gameBatch.map(async game => {
                        let gameAssets = await unZipGamingAssets(game.gameAssets, game.gameOwner + '.zip');
                        console.log(gameAssets)
                        return {
                            gameId: game.gameId.toString(),
                            gameOwner: game.gameOwner,
                            gameName: game.gameName,
                            nftName: game.nftName,
                            nftSymbol: game.nftSymbol,
                            price: await BlockchainService.getFormattedEther(game.price),
                            gameUrl: game.gameUrl,
                            gameAssets: gameAssets,
                            key: game.gameAssets,
                            timestamp: parseInt(game.timestamp)
                        };
                    })
                );
    
                const successfulGames = processedGames.filter(result => result.status === 'fulfilled').map(result => result.value);
                allGame.push(...successfulGames);
            }
            
            console.log(allGame)
            setAllGames(allGame);

        }
        catch(e){
            console.log(e)
        }
    };
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

        setAllNfts(allItem);
    };

    const init = async () => {
        if (await BlockchainService.enableEthereum()) {
            const signer = await BlockchainService.getSignerAccount();
            console.log(signer);
            setAccountData(signer);
            const currentNetwork = await BlockchainService.getCurrentNetwork();
            // setGasprice(await BlockchainService.getGasPrice());
            setSelectedNetwork(currentNetwork);
            setSelectedMarketPlace(currentNetwork);
            setSelectedTargetChain(currentNetwork);
            const allGames = await BlockchainService.getPurchasedGames();
            setAllRawGames(allGames);
            if (allGames) {
                console.log(allGames);
                const games = allGames[currentNetwork.chainId].games;
                await processGame(games);
            }

            setAllRawGames(allGames);
            setSelectedGame(allGames[currentNetwork.chainId].games[0]);
            const items = await BlockchainService.getMyNFT(
                allGames[currentNetwork.chainId].games[0].gameId,
                currentNetwork.rpcUrls,
                currentNetwork.chainId
            );
            await processNFTs(items);

            try {
            } catch (e) {
                console.log(e.message);
            }
        }
    };

    const handleGameCardClick = async game => {
        console.log(game);
        const gameAssets = { ...game.gameAssets };
        if (gameAssets['gameThumbnail.png']) {
            gameAssets['gameThumbnail.png'] = await convertBlobToBase64(gameAssets['gameThumbnail.png']);
        }
        if (gameAssets['gameVideo.mp4']) {
            gameAssets['gameVideo.mp4'] = await convertBlobToBase64(gameAssets['gameVideo.mp4']);
        }
        if (gameAssets['gameRules.txt']) {
            gameAssets['gameRules.txt'] = await convertBlobToBase64(gameAssets['gameRules.txt']);
        }
        if (gameAssets['gameDescription.txt']) {
            gameAssets['gameDescription.txt'] = await convertBlobToBase64(gameAssets['gameDescription.txt']);
        }
        console.log(gameAssets);
        const serializedGame = JSON.stringify({ ...game, gameAssets, ...allRawGames[selectedMarketPlace.chainId].network });
        navigate(`/main/games/${game.gameId}`, { state: { game: serializedGame } });
    };
    const [viewModal, setViewModal] = useState(false);
    const changeGame = async game => {
        setSelectedGame(game);
        const items = await BlockchainService.getMyNFT(game.gameId, selectedMarketPlace.rpcUrls, selectedMarketPlace.chainId);
        await processNFTs(items);
    };

    const handleCardClick = item => {
        setSelectedItem(item);
        setViewModal(true);
    };

    const handleChangeMarketPlace = async network => {
        setSelectedMarketPlace(network);
        console.log(allGames);
        const items = await BlockchainService.getMyNFT(allGames[0].gameId, network.rpcUrls, network.chainId);
        if (items) await processNFTs(items);
    };
    const [selectedTargetChain, setSelectedTargetChain] = useState({});
    const handleSelectedTargetChain = async network => {
        setSelectedTargetChain(network);
        const gasPrice = await BlockchainService.getGasPrice(network);
        setGasprice(gasPrice);
    };
    const calculateLiveExchange = async value => {
        setLivePrice(value);
        let source = latestPrice[selectedNetwork.nativeCurrency];
        let destination = latestPrice[selectedTargetChain.nativeCurrency];
        setExchaingedPrice((source / destination) * value);
    };
    const [newPrice, setNewPrice] = useState(0);
    const [isNFTUploading, setIsNFTUploading] = useState(false);
    const [spinnerMessage, setSpinnerMessage] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const teleportNFT = async () => {
        let data = {
            targetChainId: selectedTargetChain.chainId,
            targetNFTAddress: selectedTargetChain.nftAddress,
            gameId: selectedGame.gameId,
            itemId: seletedItem.itemId,
            price: newPrice,
            gasPrice: gasPrice,
            sourceChainId: selectedMarketPlace.chainId
        };
        const url = '/main/teleport'; // the path you want to navigate to
        const params = new URLSearchParams({ data: JSON.stringify(data) }).toString();
        window.open(`${url}?${params}`, '_blank');
        // try {
        //     setIsNFTUploading(true);
        //     setSpinnerMessage('Teleporting in Progress...');
        //     let res = BlockchainService.teleportNFT(
        //         selectedTargetChain.chainId,
        //         selectedTargetChain.nftAddress,
        //         selectedGame.gameId,
        //         seletedItem.itemId,
        //         newPrice,
        //         gasPrice
        //     );
        //     if (!res.hash) return;
        //     setIsNFTUploading(false);
        //     setTransactionHash(res.hash);
        //     setSpinnerMessage('Teleported Successfully');
        // } catch (e) {
        //     setSpinnerMessage(e.reason);
        //     setTimeout(() => {
        //         window.location.reload();
        //     }, 3000);
        // }
    };
    const handleConvert = () => {
        const totalDays = parseInt(days) || 0;
        const totalHours = parseInt(hours) || 0;
        const totalMinutes = parseInt(minutes) || 0;
        const totalSecondsInput = parseInt(seconds) || 0;

        const totalSeconds = totalDays * 86400 + totalHours * 3600 + totalMinutes * 60 + totalSecondsInput;
        return totalSeconds;
    };
    // const rentNFT = async () => {
    //     const duration = handleConvert();
    //     try {
    //         setIsNFTUploading(true);
    //         setSpinnerMessage('Lending in Progress...');
    //         let res = await BlockchainService.lendNFT(seletedItem.itemId, newPrice, duration, selectedGame.gameId, selectedGame.gameName);
    //         if (!res.hash) return;
    //         setIsNFTUploading(false);
    //         setTransactionHash(res.hash);
    //         setSpinnerMessage('Lended Successfully');
    //     } catch (e) {
    //         setSpinnerMessage('Rejected');
    //         setTimeout(() => {
    //             window.location.reload();
    //         }, 3000);
    //     }
    // };

    const rentNFT = () => {
        const duration = handleConvert();
        const price = newPrice.toString();
        const state = {
            nft: {
                itemId: seletedItem.itemId,
                price,
                duration,
                sourceChainId: selectedMarketPlace.chainId,
                gameName: selectedGame.gameName,
                gameId: selectedGame.gameId
            }
        };

        // Convert state object to a query string
        const queryString = encodeURIComponent(JSON.stringify(state));

        // Construct the URL with the query string
        const url = `/main/renting?state=${queryString}`;

        // Open the URL in a new tab
        window.open(url, '_blank');
    };
    return (
        <div>
            <h3 className='text-center'>
                Welcome to your<span className='text-primary'> Assets</span> Zone
            </h3>
            <h5 className='text-center mt-3'>
                {' '}
                You are currently at <span className='text-primary'>{selectedNetwork.chainName} Blockchain</span>
            </h5>

            <div className='carousel-sliding-container mt-3'>
                <div className='carousel-sliding-content mt-4'>
                    {Object.entries(GAMEIMAGES).map(([chainId, network]) => (
                        <div key={chainId} className='carousel-sliding-item'>
                            <img
                                src={network.image}
                                alt={network.chainName}
                                className='carousel-sliding-image'
                                style={{ height: '100px', width: '100px' }}
                            />
                            <p className='mt-2' style={{ fontSize: '12px' }}>
                                {/* {network.chainName} */}
                            </p>
                        </div>
                    ))}
                    {Object.entries(GAMEIMAGES).map(([chainId, network]) => (
                        <div key={chainId} className='carousel-sliding-item'>
                            <img
                                src={network.image}
                                alt={network.chainName}
                                className='carousel-sliding-image'
                                style={{ height: '100px', width: '100px' }}
                            />
                            <p className='mt-2' style={{ fontSize: '12px' }}>
                                {/* {network.chainName} */}
                            </p>
                        </div>
                    ))}
                    {Object.entries(GAMEIMAGES).map(([chainId, network]) => (
                        <div key={chainId} className='carousel-sliding-item'>
                            <img
                                src={network.image}
                                alt={network.chainName}
                                className='carousel-sliding-image'
                                style={{ height: '100px', width: '100px' }}
                            />
                            <p className='mt-2' style={{ fontSize: '12px' }}>
                                {/* {network.chainName} */}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <Tabs defaultActiveKey='games' id='uncontrolled-tab-example' className='mb-3 mt-5' variant='pills' fill>
                <Tab eventKey='games' title='Your Games'>
                    {!allGames.length ? (
                        <div
                            style={{
                                borderStyle: 'groove',
                                borderRadius: '15px',
                                padding: '10px 10px 10px 10px'
                            }}
                        >
                            <div className='col-12 d-flex justify-content-center align-items-center'>
                                <div className='page-title-box text-center'>
                                    <p
                                        style={{
                                            fontSize: '25px',
                                            fontWeight: 'bold'
                                        }}
                                    >
                                        No Games Found ...
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
                                            {allGames.map((item, index) => {
                                                if (Object.keys(item.gameAssets).length > 0) {
                                                    return (
                                                        <div key={index} className='mt-4'>
                                                            {item.gameAssets['gameThumbnail.png'] && (
                                                                <Card className='game-card m-2' onClick={() => handleGameCardClick(item)}>
                                                                    <Card.Img
                                                                        style={{ width: '150px', height: '150px' }}
                                                                        variant='top'
                                                                        src={URL.createObjectURL(item.gameAssets['gameThumbnail.png'])}
                                                                        alt='Game Thumbnail'
                                                                    />
                                                                    <Card.Body>
                                                                        <Card.Title className='text-center'>{item.gameName}</Card.Title>
                                                                    </Card.Body>
                                                                </Card>
                                                            )}
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
                </Tab>
                <Tab eventKey='nfts' title='Your NFTs'>
                    <div className='d-flex float-end'>
                        <Dropdown className='custom-dropdown float-end mt-1 me-3'>
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
                        <Dropdown className='float-end mt-1 me-3'>
                            <Dropdown.Toggle variant='success' id='dropdown-basic'>
                                {selectedGame.gameName}
                            </Dropdown.Toggle>

                            <Dropdown.Menu style={{ width: '150px' }}>
                                {allGames.map((game, index) => (
                                    <Dropdown.Item key={index} eventKey={game.gameId} onClick={() => changeGame(game)}>
                                        {game.gameName}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
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
                                                            <Card className='game-card m-2' onClick={() => handleCardClick(item)}>
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
                </Tab>
            </Tabs>

            {seletedItem.images && (
                <Modal show={viewModal} size='xl'>
                    <Modal.Header closeButton>
                        <Modal.Title>View NFT</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <></>
                        <Container>
                            <Row>
                                <Col>
                                    <Carousel>
                                        {seletedItem.images.map((image, index) => (
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
                                                        <h3 className='text-black'>{seletedItem.caption[index]}</h3>
                                                    </Carousel.Caption>
                                                </div>
                                            </Carousel.Item>
                                        ))}
                                    </Carousel>
                                </Col>
                            </Row>
                        </Container>

                        <h4 className='text-center mt-5'>{seletedItem.description}</h4>
                        <h6 className='text-center'>
                            Purchased with{' '}
                            <span className='text-success'>
                                {seletedItem.price} {selectedNetwork.nativeCurrency}
                            </span>
                        </h6>

                        <Accordion>
                            <Accordion.Item eventKey='0'>
                                <Accordion.Header>Advanced Options</Accordion.Header>
                                <Accordion.Body>
                                    <Tabs id='controlled-tab-example' className='mb-3' variant='pills' fill onSelect={k => setTab(k)}>
                                        <Tab eventKey='teleport' title=' Teleport NFT'>
                                            <Row>
                                                <Col>
                                                    <Form.Group controlId='formInput3'>
                                                        <Form.Label>Enter price in {selectedTargetChain.nativeCurrency}</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            name='input3'
                                                            value={newPrice}
                                                            onChange={e => setNewPrice(e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    {selectedTargetChain ? (
                                                        <>
                                                            <Dropdown className='custom-dropdown mt-4'>
                                                                <Dropdown.Toggle variant='secondary'>
                                                                    <img
                                                                        src={selectedTargetChain.image}
                                                                        alt={selectedTargetChain.chainName}
                                                                        className='network-image me-2'
                                                                    />
                                                                    {selectedTargetChain.chainName} as Target Chain
                                                                </Dropdown.Toggle>
                                                                <Dropdown.Menu>
                                                                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                                                                        <Dropdown.Item
                                                                            key={chainId}
                                                                            onClick={() => handleSelectedTargetChain(network)}
                                                                            className='mt-2'
                                                                        >
                                                                            <img
                                                                                src={network.image}
                                                                                alt={network.chainName}
                                                                                className='network-image me-2'
                                                                            />
                                                                            {network.chainName}
                                                                        </Dropdown.Item>
                                                                    ))}
                                                                </Dropdown.Menu>
                                                            </Dropdown>{' '}
                                                        </>
                                                    ) : (
                                                        <></>
                                                    )}
                                                </Col>

                                                <Col>
                                                    <Form.Group controlId='formInput4'>
                                                        <Form.Label>Gas Price(Optional)</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            name='input4'
                                                            value={gasPrice}
                                                            onChange={e => setGasprice(e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <div className='d-flex justify-content-center align-item-center mt-4'>
                                                <Button variant='success ' style={{ width: '200px' }} onClick={teleportNFT}>
                                                    Teleport NFT
                                                </Button>
                                            </div>
                                            <div className='d-flex justify-content-center align-items-center mt-3'>
                                                <Spinners on={isNFTUploading} />
                                                <h5 className='ms-2'>
                                                    {transactionHash && (
                                                        <img src='/src/assets/images/thumbsup.svg' height={30} width={40} className='mb-2' />
                                                    )}
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
                                                            href={transactionHash}
                                                            target='_blank'
                                                            className='text-center'
                                                        >
                                                            <h6 className='text-primary mt-2'>
                                                                {transactionHash} <span class='mdi mdi-open-in-new'></span>
                                                            </h6>
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                            <h5 className='text-center mt-5'>Live Exchange</h5>
                                            <Row>
                                                <Col>
                                                    <Form.Group controlId='formInput3'>
                                                        <Form.Label>Enter {selectedNetwork.chainName} price</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            name='input3'
                                                            value={livePrice}
                                                            onChange={e => calculateLiveExchange(e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    <Form.Group controlId='formInput4'>
                                                        <Form.Label>Equivalent {selectedTargetChain.chainName} price</Form.Label>
                                                        <Form.Control type='text' name='input4' readOnly value={exchangedPrice} />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Tab>
                                        <Tab eventKey='lend' title=' Rent NFT'>
                                            <Row>
                                                <Col>
                                                    <Form.Group controlId='formInput3'>
                                                        <Form.Label>Enter price in {selectedNetwork.nativeCurrency}</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            name='input3'
                                                            value={newPrice}
                                                            onChange={e => setNewPrice(e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Days</Form.Label>
                                                        <Form.Control type='number' value={days} onChange={e => setDays(e.target.value)} />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Hours</Form.Label>
                                                        <Form.Control type='number' value={hours} onChange={e => setHours(e.target.value)} />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Minutes</Form.Label>
                                                        <Form.Control type='number' value={minutes} onChange={e => setMinutes(e.target.value)} />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    <Form.Group className='mb-3'>
                                                        <Form.Label>Seconds</Form.Label>
                                                        <Form.Control type='number' value={seconds} onChange={e => setSeconds(e.target.value)} />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                            <div className='d-flex justify-content-center align-item-center mt-4'>
                                                <Button
                                                    variant='success '
                                                    style={{ width: '200px' }}
                                                    onClick={rentNFT}
                                                    // disabled={selectedMarketPlace.chainId !== selectedNetwork.chainId}
                                                >
                                                    Lend NFT
                                                </Button>
                                            </div>
                                            <div className='d-flex justify-content-center align-items-center mt-3'>
                                                <Spinners on={isNFTUploading} />
                                                <h5 className='ms-2'>
                                                    {transactionHash && (
                                                        <img src='/src/assets/images/thumbsup.svg' height={30} width={40} className='mb-2' />
                                                    )}
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
                                                                tab === 'teleport'
                                                                    ? '/main/explorer/' + transactionHash
                                                                    : selectedNetwork.explorer + transactionHash
                                                            }
                                                            target='_blank'
                                                            className='text-center'
                                                        >
                                                            <h6 className='text-primary mt-2'>
                                                                {transactionHash} <span class='mdi mdi-open-in-new'></span>
                                                            </h6>
                                                        </a>
                                                    </>
                                                )}
                                            </div>
                                            <h5 className='text-center mt-3'>Live Exchange</h5>
                                            <Row>
                                                <Col>
                                                    <Form.Group controlId='formInput3'>
                                                        <Form.Label>Enter {selectedNetwork.chainName} price</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            name='input3'
                                                            value={livePrice}
                                                            onChange={e => calculateLiveExchange(e.target.value)}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    <Form.Group controlId='formInput4'>
                                                        <Form.Label>Equivalent {selectedTargetChain.chainName} price</Form.Label>
                                                        <Form.Control type='text' name='input4' readOnly value={exchangedPrice} />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
                                        </Tab>
                                    </Tabs>
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant='secondary' onClick={() => setViewModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
}

export default MyAssets;
