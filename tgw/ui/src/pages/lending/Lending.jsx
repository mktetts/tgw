import React, { useState, useEffect } from 'react';
import { GAMEIMAGES } from './images';
import { useNavigate } from 'react-router-dom';
import BlockchainService from '../../blockchain/service';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { decodeNFT } from '../../helpers/helpers';
import { Button, Card, Carousel, Col, Container, Dropdown, Modal, Row } from 'react-bootstrap';
import Spinners from '../../components/Spinners';
function Lending() {
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [selectedMarketPlace, setSelectedMarketPlace] = useState({});
    const [allGames, setAllGames] = useState([]);
    const navigate = useNavigate();
    const [allRawNfts, setAllRawNFTS] = useState({});
    const [allNfts, setAllNfts] = useState([]);
    const [seletedItem, setSelectedItem] = useState({});
    const [selectedGame, setSelectedGame] = useState({});
    const [accountData, setAccountData] = useState({});
    const [allLendedTokens, setAllLendedTokens] = useState([]);
    const [allLockedTokens, setAllLockedTokens] = useState([]);
    const [myLendedTokens, setMyLendedTokens] = useState([]);
    const [convertedTime, setConvertedTime] = useState(null);
    const [allGameIds, setAllGameIds] = useState([]);
    const [selectedGameId, setSelectedGameId] = useState({});
    const [tab, setTab] = useState('pool');
    const [rentedNFTs, setRentedNFTs] = useState([]);
    useEffect(() => {
        init();
    }, []);

    const processNFTs = async (items, signer, lendingId, duration, amount, borrower, startTime) => {
        let allItem = [];
        let MyLended = [];
        const batchSize = 5; // Number of parallel fetches

        for (let i = 0; i < items.length; i += batchSize) {
            const itemBatch = items.slice(i, i + batchSize);

            const processedItems = await Promise.allSettled(
                itemBatch.map(async item => {
                    try {
                        let storekey = item.storekey;
                        let { images, metadata } = await decodeNFT(storekey, item.owner + '.zip');
                        let itemData = {
                            lendingId: lendingId,
                            duration: duration,
                            startTime: startTime,
                            lendingAmount: await BlockchainService.getFormattedEther(amount),
                            name: metadata.name,
                            description: metadata.description,
                            caption: metadata.captions,
                            itemId: parseInt(item.id),
                            price: await BlockchainService.getFormattedEther(item.price),
                            owner: item.owner,
                            images: images,
                            uri: storekey
                        };

                        if (borrower === '0x0000000000000000000000000000000000000000') {
                            allItem.push(itemData);
                        }

                        if (item.owner === signer) {
                            MyLended.push({
                                ...itemData,
                                borrower: borrower
                            });
                        }

                        return itemData;
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

        
        return {
            all: allItem,
            mine: MyLended
        };
        setMyLendedTokens(MyLended);
        setAllNfts(allItem);
    };
    const extractUniqueItems = data => {
        const uniqueItems = new Set();
        data.forEach(obj => {
            if (obj.gameId) {
                uniqueItems.add({ gameId: obj.gameId, gameName: obj.gameName });
            }
        });
        return Array.from(uniqueItems);
    };
    const init = async () => {
        if (await BlockchainService.enableEthereum()) {
            const signer = await BlockchainService.getSignerAccount();
            console.log(signer);
            const currentNetwork = await BlockchainService.getCurrentNetwork();
            setSelectedNetwork(currentNetwork);
            const activeLendings = await BlockchainService.getActiveLendings();

            const allGameIdss = extractUniqueItems(activeLendings);
            setAllGameIds(allGameIdss);
            let allLendings = {};
            for (let i = 0; i < activeLendings.length; i++) {
                const gameId = activeLendings[i].gameId;
                const lockedTokens = await BlockchainService.getLockedTokens(gameId);
                console.log(activeLendings[i]);
                const nfts = await processNFTs(
                    lockedTokens,
                    signer.address,
                    activeLendings[i].lendingId,
                    activeLendings[i].duration,
                    activeLendings[i].lendingAmount,
                    activeLendings[i].borrower,
                    activeLendings[i].startTime
                );
                // activeLendings[i]['nfts'] = nfts
                allLendings[gameId] = { lendingDetails: activeLendings[i], lendingId: i, nfts: nfts };
            }
            console.log(allLendings);
            setAllLendedTokens(allLendings);
            let gid = Object.keys(allLendings)[0];
            console.log(gid);
            setSelectedGameId(allGameIdss[0]);
            setSelectedGame(gid);

            setAllNfts(allLendings[gid].nfts);

            const borrowed = await BlockchainService.getBorrowedNFTs();
            console.log(borrowed);
            let borrowedNFT = [];
            for (let i = 0; i < borrowed.length; i++) {
                let items = await BlockchainService.getNFTById(borrowed[i].gameId, borrowed[i].tokenId);
                console.log(items);
                let storekey = items.storekey;
                let { images, metadata } = await decodeNFT(storekey, items.owner + '.zip');
                borrowedNFT.push({
                    name: metadata.name,
                    description: metadata.description,
                    caption: metadata.captions,
                    itemId: parseInt(items.id),
                    price: await BlockchainService.getFormattedEther(items.price),
                    owner: items.owner,
                    images: images,
                    uri: storekey,
                    startTime: parseInt(borrowed[i].startTime),
                    duration: parseInt(borrowed[i].duration)
                });
            }
            setRentedNFTs(borrowedNFT);
            try {
            } catch (e) {
                console.log(e.message);
            }
        }
    };
    const [viewModal, setViewModal] = useState(false);
    const handleRentCardClick = item => {
        console.log(seletedItem);
        const totalSeconds = parseInt(item.duration);
        const convertedDays = Math.floor(totalSeconds / 86400);
        const convertedHours = Math.floor((totalSeconds % 86400) / 3600);
        const convertedMinutes = Math.floor((totalSeconds % 3600) / 60);
        const convertedSeconds = totalSeconds % 60;

        setConvertedTime({
            days: convertedDays,
            hours: convertedHours,
            minutes: convertedMinutes,
            seconds: convertedSeconds
        });
        setSelectedItem(item);
        setViewModal(true);
    };
    const [enableRetriveButton, setEnableRetriveButton] = useState(false);
    const handleRetriveNFTCardClick = async item => {
        console.log(item);
        if (parseInt(item.startTime) === 0) {
            setEnableRetriveButton(true);
        }
        if (item.borrower !== '0x0000000000000000000000000000000000000000') {
            const currentTimeInSeconds = Math.floor(Date.now() / 1000);
            const endTime = parseInt(item.startTime) + parseInt(item.duration);
            const differenceInSeconds = endTime - currentTimeInSeconds;

            // Ensure the difference is not negative
            const positiveDifferenceInSeconds = Math.max(differenceInSeconds, 0);

            const days = Math.floor(positiveDifferenceInSeconds / (24 * 3600));
            const hours = Math.floor((positiveDifferenceInSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((positiveDifferenceInSeconds % 3600) / 60);
            const seconds = Math.floor(positiveDifferenceInSeconds % 60);

            console.log(minutes);
            setEnableRetriveButton(days === 0 && hours === 0 && minutes === 0 && seconds === 0);
            setConvertedTime({
                days: days,
                hours: hours,
                minutes: minutes,
                seconds: seconds
            });
        } else {
            const totalSeconds = parseInt(item.duration);
            const convertedDays = Math.floor(totalSeconds / 86400);
            const convertedHours = Math.floor((totalSeconds % 86400) / 3600);
            const convertedMinutes = Math.floor((totalSeconds % 3600) / 60);
            const convertedSeconds = totalSeconds % 60;

            setConvertedTime({
                days: convertedDays,
                hours: convertedHours,
                minutes: convertedMinutes,
                seconds: convertedSeconds
            });
        }
        setSelectedItem(item);
        setViewModal(true);
    };
    const [isNFTUploading, setIsNFTUploading] = useState(false);
    const [spinnerMessage, setSpinnerMessage] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const retriveNFT = async () => {
        console.log(seletedItem);
        try {
            setIsNFTUploading(true);
            setSpinnerMessage('Retrieving in Progress...');
            let res = await BlockchainService.retriveNFT(seletedItem.lendingId);
            console.log(res.hash);
            if (!res.hash) return;
            setIsNFTUploading(false);
            setTransactionHash(res.hash);
            setSpinnerMessage('Retrived Successfully');
        } catch (e) {
            setSpinnerMessage(e.reason);
            // setTimeout(() => {
            //     window.location.reload();
            // }, 3000);
        }
    };

    const changeGame = async game => {
        setSelectedGameId(game);
        let gameId = game.gameId;
        setAllNfts(allLendedTokens[gameId].nfts);
    };

    const rentNFT = async () => {
        console.log(seletedItem);
        try {
            setIsNFTUploading(true);
            setSpinnerMessage('Renting in Progress...');
            let res = await BlockchainService.rentNFT(seletedItem.lendingId, seletedItem.lendingAmount);
            if (!res.hash) return;
            setIsNFTUploading(false);
            setTransactionHash(res.hash);
            setSpinnerMessage('Rented NFT Successfully');
        } catch (e) {
            setSpinnerMessage('Rejected');
            // setTimeout(() => {
            //     window.location.reload();
            // }, 3000);
        }
    };

    const handleRentedCardClick = async item => {
        console.log(item);
        const differenceInSeconds = item.startTime + item.duration - Math.floor(Date.now() / 1000);
        const days = Math.floor(differenceInSeconds / (24 * 3600));
        const hours = Math.floor((differenceInSeconds % (24 * 3600)) / 3600);
        const minutes = Math.floor((differenceInSeconds % 3600) / 60);
        const seconds = Math.floor(differenceInSeconds % 60);
        console.log(minutes);
        setConvertedTime({
            days: days,
            hours: hours,
            minutes: minutes,
            seconds: seconds
        });
        setSelectedItem(item);
        setViewModal(true);
    };
    return (
        <div>
            <h3 className='text-center'>
                Welcome to <span className='text-primary'>NFT Renting Zone</span> Zone
            </h3>
            <h5 className='text-center mt-3'>
                {' '}
                You are currently at <span className='text-primary'>{selectedNetwork.chainName} Blockchain</span>
            </h5>

            <div className='carousel-sliding-container mt-3 mb-5'>
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
            <Dropdown className=' mb-5'>
                <Dropdown.Toggle variant='success' id='dropdown-basic'>
                    {selectedGameId?.gameName}
                </Dropdown.Toggle>

                <Dropdown.Menu style={{ width: '150px' }}>
                    {allGameIds.map((game, index) => (
                        <Dropdown.Item key={index} eventKey={game.gameId} onClick={() => changeGame(game)}>
                            {game.gameName}
                        </Dropdown.Item>
                    ))}
                </Dropdown.Menu>
            </Dropdown>
            <Tabs defaultActiveKey='pool' id='uncontrolled-tab-example' className='mb-3 mt-4' variant='pills' fill onSelect={k => setTab(k)}>
                <Tab eventKey='pool' title='NFT Lending pool'>
                    {!allNfts.all?.length ? (
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
                                            {allNfts.all.map((item, index) => {
                                                if (Object.keys(item.images).length > 0) {
                                                    return (
                                                        <div key={index} className='mt-4'>
                                                            <Card className='game-card m-2' onClick={() => handleRentCardClick(item)}>
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
                <Tab eventKey='mine' title='My NFTS in Lending Pool'>
                    {!allNfts.mine?.length ? (
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
                                            {allNfts.mine.map((item, index) => {
                                                if (Object.keys(item.images).length > 0) {
                                                    return (
                                                        <div key={index} className='mt-4'>
                                                            <Card className='game-card m-2' onClick={() => handleRetriveNFTCardClick(item)}>
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
                <Tab eventKey='rented' title='My Rented NFTs'>
                    {!rentedNFTs.length ? (
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
                                            {rentedNFTs.map((item, index) => {
                                                if (Object.keys(item.images).length > 0) {
                                                    return (
                                                        <div key={index} className='mt-4'>
                                                            <Card className='game-card m-2' onClick={() => handleRentedCardClick(item)}>
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
                    <Modal.Header>
                        <Modal.Title>View NFT</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
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
                        {/* <Container>
                            <Row>
                                {seletedItem.images.map((image, index) => (
                                    <Col key={index}>
                                        <div className='image-container text-center'>
                                            <img src={image} alt={`Image ${index + 1}`} width={200} height={200} />
                                            <h3>{seletedItem.caption[index]}</h3>
                                        </div>
                                    </Col>
                                ))}
                            </Row>
                        </Container> */}

                        <h4 className='text-center mt-5'>{seletedItem.description}</h4>
                        <h6 className='text-center'>
                            Rent Amount{' '}
                            <span className='text-success'>
                                {parseInt(seletedItem.lendingAmount)} {selectedNetwork.nativeCurrency}
                            </span>
                        </h6>
                        <h6 className='text-center'>
                            Duration:{' '}
                            <span className='text-success'>
                                {convertedTime.days} days, {convertedTime.hours} hours, {convertedTime.minutes} minutes, {convertedTime.seconds}{' '}
                                seconds
                            </span>
                        </h6>

                        <div className='d-flex justify-content-center align-items-center mt-3'>
                            <Spinners on={isNFTUploading} />
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
                                        href={selectedNetwork.explorer + transactionHash}
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
                        {tab === 'pool' && !transactionHash && (
                            <Button variant='success' onClick={rentNFT}>
                                Rent
                            </Button>
                        )}
                        {tab === 'mine' && !transactionHash && (
                            <Button variant='success' onClick={retriveNFT} disabled={!enableRetriveButton}>
                                Retrive
                            </Button>
                        )}
                        <Button variant='secondary' onClick={() => setViewModal(false)}>
                            Close
                        </Button>
                    </Modal.Footer>
                </Modal>
            )}
        </div>
    );
}

export default Lending;
