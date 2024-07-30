import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Dropdown } from 'react-bootstrap';
import { GAMEIMAGES } from './images';
import UploadGame from './UploadGame';
import { convertBlobToBase64, unZipGamingAssets } from '../../helpers/helpers';
import { useNavigate } from 'react-router-dom';
import { NETWORKS } from '../../blockchain/networks';
import GameId from './GameId';
import ProviderService from '../../blockchain/providerService';
import GameContract from '../../blockchain/gameContract';
import BlockchainService from '../../blockchain/service';

function Games() {
    const [isHovered, setIsHovered] = useState(false);

    const buttonStyle = {
        transition: 'transform 0.3s',
        transform: isHovered ? 'scale(1.2)' : 'scale(1)' // Slightly enlarge on hover
    };
    const navigate = useNavigate();

    const [openUploadGameModal, setOpenUploadGameModal] = useState(false);
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [selectedMarketPlace, setSelectedMarketPlace] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [ToastMessage, setToastMessage] = useState('');
    const [accountData, setAccountData] = useState({});
    const [allGames, setAllGames] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [gameIdModal, setGameIdModal] = useState(false);

    useEffect(() => {
        init();
    }, []);

    const [allRawGames, setAllRawGames] = useState('');
    const processGame = async games => {
        let allGame = [];
        const batchSize = 5; // Number of parallel fetches

        for (let i = 0; i < games.length; i += batchSize) {
            const gameBatch = games.slice(i, i + batchSize);

            const processedGames = await Promise.allSettled(
                gameBatch.map(async game => {
                    let gameAssets = await unZipGamingAssets(game.gameAssets, game.gameOwner + '.zip');
                    return {
                        gameId: game.gameId.toString(),
                        gameOwner: game.gameOwner,
                        gameName: game.gameName,
                        nftName: game.nftName,
                        nftSymbol: game.nftSymbol,
                        price: await ProviderService.getFormattedEther(game.price),
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

        console.log(allGame);
        setAllGames(allGame);
    };
    const init = async () => {
        try {
            await BlockchainService.enableEthereum()
            await ProviderService.enableEthereum();
            const signer = await ProviderService.getSignerAccount();
            setAccountData(signer);
            const currentNetwork = await ProviderService.getCurrentNetwork();
            setSelectedNetwork(currentNetwork);
            setSelectedMarketPlace(currentNetwork);
            const allGames = await GameContract.getAllGames();
            setAllRawGames(allGames);
            if (allGames) {
                const games = allGames[currentNetwork.chainId].games;
                await processGame(games);
            }
        } catch (e) {
            console.log(e);
            setShowToast(true);
            if (e.message.includes('user rejected action ')) {
                setToastMessage('User Rejected the action');
            } else {
                setToastMessage(e.message);
            }
        }
    };

    const handleCardClick = async game => {
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
    const handleChangeMarketPlace = async network => {
        setSelectedMarketPlace(network);
        const games = allRawGames[network.chainId].games;
        if (games) await processGame(games);
    };
    return (
        <div>
            <h3 className='text-center'>
                Welcome to the<span className='text-primary'> Game Uploading</span> Zone
            </h3>
            <h5 className='text-center mt-3'>
                {' '}
                Enter the game zone by uploading your creation and challenging players from all corners of the globe!
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
            <div className='d-flex justify-content-center align-items-center'>
                <Button
                    variant='primary'
                    className='mt-4 me-4'
                    // style={buttonStyle}
                    // onMouseEnter={() => setIsHovered(true)}
                    // onMouseLeave={() => setIsHovered(false)}
                    onClick={() => setGameIdModal(true)}
                >
                    GET FREE GAME ID
                </Button>
                <Button
                    variant='primary'
                    className='mt-4'
                    // style={buttonStyle}
                    // onMouseEnter={() => setIsHovered(true)}
                    // onMouseLeave={() => setIsHovered(false)}
                    // onClick={() => setGameIdModal(true)}
                    as='a'
                    href='/main/deploy'
                    target='_blank'
                >
                    <span className='mdi mdi-cloud-arrow-up-outline me-2'></span>
                    DEPLOY GAME TO EDGE SERVER
                </Button>
                <Button
                    variant='primary'
                    className='ms-4 mt-4'
                    // style={buttonStyle}
                    // onMouseEnter={() => setIsHovered(true)}
                    // onMouseLeave={() => setIsHovered(false)}
                    onClick={() => setOpenUploadGameModal(true)}
                >
                    + CREATE YOUR GAME IN BLOCKCHAIN
                </Button>
            </div>
            <div className='d-flex align-items-center'>
                <div>
                    <h4 className='mt-5'>
                        <img src={selectedMarketPlace.image} className='me-2 mb-1' height={30} width={30} />
                        {selectedMarketPlace.chainName} Games
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
                                                        <Card className='game-card m-2' onClick={() => handleCardClick(item)}>
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
            <UploadGame show={openUploadGameModal} close={() => setOpenUploadGameModal(false)} />
            <GameId show={gameIdModal} close={() => setGameIdModal(false)} />
        </div>
    );
}

export default Games;
