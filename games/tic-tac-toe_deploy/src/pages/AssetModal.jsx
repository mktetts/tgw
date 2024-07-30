import React, { useEffect, useState } from 'react';
import { Button, Card, Col, Modal, Row, Carousel, Container } from 'react-bootstrap';
import BlockchainService from '../blockchain/service';
import { decodeNFT } from '../helpers/helpers';

function AssetModal(props) {
    const [viewModal, setViewModal] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const buttonStyle = {
        transition: 'transform 0.3s',
        transform: isHovered ? 'scale(1.2)' : 'scale(1)' // Slightly enlarge on hover
    };
    useEffect(() => {
        console.log(props.gameId);
        loadNFTs();
    }, [props.gameId]);
    const [allRawNfts, setAllRawNFTS] = useState({});
    const [allNfts, setAllNfts] = useState([]);
    const [seletedItem, setSelectedItem] = useState({});
    const [allBorrowedNFT, setAllBorrowedNFT] = useState([]);
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
                            itemId: parseInt(item.id),
                            price: await BlockchainService.getFormattedEther(item.price),
                            owner: item.owner,
                            images: images,
                            uri: storekey
                        };
                    } catch (error) {
                        // console.error('Error processing NFT:', error);
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
        if (allItem[0]) {
            props.default(allItem[0]);
        }
        setAllNfts(prevNfts => [...prevNfts, ...allItem]);
    };

    const [accountData, setAccountData] = useState({});
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const loadNFTs = async () => {
        if (await BlockchainService.enableEthereum()) {
            try {
                const signer = await BlockchainService.getSignerAccount();
                setAccountData(signer);
                const currentNetwork = await BlockchainService.getCurrentNetwork();
                setSelectedNetwork(currentNetwork);
                const items = await BlockchainService.getMyNFT(props.gameId);
                console.log(items);
                const borrowed = await BlockchainService.getBorrowedNFTs();
                console.log(borrowed);
                let borrowedNFT = [];
                for (let i = 0; i < borrowed.length; i++) {
                    let item = await BlockchainService.getNFTById(borrowed[i].gameId, borrowed[i].tokenId);
                    borrowedNFT.push(item);
                }
                await processNFTs(items);
                await processNFTs(borrowedNFT);
            } catch (e) {
                console.log(e.message);
            }
        }
    };

    const handleCardClick = item => {
        setSelectedItem(item);
        setViewModal(true);
    };

    const setAsDefault = () => {
        props.default(seletedItem);
        setViewModal(false);
    };
    return (
        <div>
            {props.gameId && (
                <>
                    <Modal show={props.show} onHide={props.close} size='xl'>
                        <Modal.Header closeButton>
                            <Modal.Title>Your Assets</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
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
                                                    {allNfts?.map((item, index) => {
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
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant='secondary' onClick={props.close}>
                                Close
                            </Button>
                        </Modal.Footer>
                    </Modal>
                    {seletedItem.images && (
                        <Modal show={viewModal} size='xl'>
                            <Modal.Header closeButton>
                                <Modal.Title>Select Default</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <Container>
                                    <Row>
                                        {seletedItem.images.map((image, index) => (
                                            <Col key={index}>
                                                <div className='image-container text-center'>
                                                    <img src={image} alt={`Image ${index + 1}`} width={200} height={200} />
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </Container>

                                <h4 className='text-center'>{seletedItem.description}</h4>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant='success' onClick={setAsDefault}>
                                    Set as Default
                                </Button>
                                <Button variant='secondary' onClick={() => setViewModal(false)}>
                                    Close
                                </Button>
                            </Modal.Footer>
                        </Modal>
                    )}
                </>
            )}
        </div>
    );
}

export default AssetModal;
