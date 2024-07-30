import React, { useState, useEffect, useContext } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import { Container, Row, Col, Form, InputGroup, Dropdown } from 'react-bootstrap';
import BlockchainService from '../../blockchain/service';
import { createZipFile, uploadGameDetails } from '../../helpers/helpers';
import Spinners from '../../components/Spinners';
import { NETWORKS } from '../../blockchain/networks';
import io from 'socket.io-client';
import Accordion from 'react-bootstrap/Accordion';
import { socketContext } from '../../socket/SocketConnection';
import ProviderService from '../../blockchain/providerService';
import GameContract from '../../blockchain/gameContract';
function UploadGame(props) {
    const { priceServer } = useContext(socketContext);
    const [accountData, setAccountData] = useState({});
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [isValidPrice, setIsValidPrice] = useState(false);
    const [price, setPrice] = useState(0);
    const [selectedTargetChain, setSelectedTargetChain] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [latestPrice, setLatestPrice] = useState({});
    const [exchangedPrice, setExchaingedPrice] = useState('');
    const [gasPrice, setGasprice] = useState('');
    const [gameForm, setGameForm] = useState({
        gameId: '',
        gameOwner: '',
        gameName: '',
        nftName: '',
        nftSymbol: '',
        price: '',
        gameRules: null,
        gameDescription: null,
        gameUrl: '',
        gameVideo: null,
        gameThumbnail: null,
        gasPrice: ''
    });
    useEffect(() => {
        init();
        if (priceServer) {
            priceServer.on('connect', () => {
                priceServer.emit('latestPrice');
                console.log('Connected to the price server');
            });

            priceServer.on('latestPrice', async data => {
                setLatestPrice(data);
            });
        }
        // const socket = io(import.meta.env.VITE_APP_PRICE_SERVER);

        // socket.on('disconnect', () => {
        //     console.log('Disconnected from the server');
        // });
    }, [priceServer]);

    const init = async () => {
        await BlockchainService.enableEthereum()
        await ProviderService.enableEthereum()
        const currentNetwork = await ProviderService.getCurrentNetwork();
        const signer = await ProviderService.getSignerAccount();
        setAccountData(signer);
        // setSellerAccount(signer.address);
        setSelectedNetwork(currentNetwork);
        setSelectedTargetChain(currentNetwork);
        // const gasPrice = await BlockchainService.getGasPrice();
        // setGameForm(prevForm => ({
        //     ...prevForm,
        //     gasPrice: gasPrice
        // }));
    };
    const handlePriceValueChange = event => {
        const { value } = event.target;
        const regex = /^[0-9]*\.?[0-9]*$/;
        if (regex.test(value)) {
            setIsValidPrice(false);
            setPrice(value);
        } else {
            setIsValidPrice(true);
        }
    };

    const handleGameFormChange = e => {
        const { name, value } = e.target;
        if (name === 'price') {
            setGameForm(prevForm => ({
                ...prevForm,
                [name]: value
            }));
            handlePriceValueChange(e);
        } else if (name === 'gameRules' || name === 'gameVideo' || name === 'gameThumbnail' || name === 'gameDescription') {
            setGameForm(prevForm => ({
                ...prevForm,
                [name]: e.target.files[0]
            }));
        } else {
            setGameForm(prevForm => ({
                ...prevForm,
                [name]: value
            }));
        }
    };
    const isFormValid = () => {
        const requiredFields = ['gameOwner', 'gameName', 'nftName', 'nftSymbol', 'price', 'gameUrl', 'gameThumbnail', 'gameId'];

        for (let field of requiredFields) {
            if (!gameForm[field]) {
                return false;
            }
        }

        return true;
    };

    const [isUploading, setIsUploading] = useState(false);
    const [spinnerMessage, setSpinnerMessage] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    //   const [zipFile, setZipFile] = useState(null);
    const [tab, setTab] = useState('');
    const handleCreateGame = async () => {
        setIsUploading(true);
        setSpinnerMessage('Assets are Uploading...');
        const zippedGameForm = await createZipFile(gameForm);
        let res = await uploadGameDetails(zippedGameForm, gameForm.gameOwner + '.zip');
        setSpinnerMessage('Uploading Game details in Blockchain...');
        if (tab === 'crosschain') {
            let data = {
                targetChainId: selectedTargetChain.chainId,
                receiverAddress: selectedTargetChain.gameAddress,
                gameId: gameForm.gameId,
                gameOwner: gameForm.gameOwner,
                gameName: gameForm.gameName,
                nftName: gameForm.nftName,
                nftSymbol: gameForm.nftSymbol,
                price: gameForm.price,
                gameUrl: gameForm.gameUrl,
                gameAssets: res.key, // change 0x
                gasPrice: gameForm.gasPrice
            };
            console.log(data);
            res = await GameContract.crossChainGameCreation(data);
        } else {
            let data = {
                gameId: gameForm.gameId,
                gameOwner: gameForm.gameOwner,
                gameName: gameForm.gameName,
                nftName: gameForm.nftName,
                nftSymbol: gameForm.nftSymbol,
                price: gameForm.price,
                gameUrl: gameForm.gameUrl,
                gameAssets: res.key
            };
            console.log(data);
            res = await GameContract.sameChainGameCreation(data);
        }
        setIsUploading(false);
        setTransactionHash(res.hash);
        setSpinnerMessage('Uploaded Game Successfully');
    };

    const handleSelectedTargetChain = async network => {
        setSelectedTargetChain(network);
        const gasPrice = await BlockchainService.getGasPrice(network);
        setGameForm(prevForm => ({
            ...prevForm,
            gasPrice: gasPrice
        }));
        if (network.chainId !== selectedNetwork.chainId) {
            let source = latestPrice[selectedNetwork.nativeCurrency];
            let destination = latestPrice[network.nativeCurrency];
            // setExchaingedPrice(destination / source);
        }
    };

    const [livePrice, setLivePrice] = useState('');
    const calculateLiveExchange = async value => {
        setLivePrice(value);
        let source = latestPrice[selectedNetwork.nativeCurrency];
        let destination = latestPrice[selectedTargetChain.nativeCurrency];
        setExchaingedPrice((source / destination) * value);
    };
    return (
        <div>
            <Modal show={props.show} onHide={props.close} backdrop='static' keyboard={false} size='lg'>
                <Modal.Header>
                    <Modal.Title>Uploade Game</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Tabs defaultActiveKey='samechain' id='fill-tab-example' className='mb-3' fill variant='pills' onSelect={k => setTab(k)}>
                        <Tab eventKey='samechain' title='Same Chain Game Creation'>
                            <div className='custom-select__selected d-flex justify-content-center align-items-center mt-4'>
                                {selectedNetwork ? (
                                    <>
                                        <h5 className=''>
                                            Target Chain:{' '}
                                            <img src={selectedNetwork.image} alt={selectedNetwork.chainName} className='ms-1 network-image me-2' />
                                            {selectedNetwork.chainName}
                                        </h5>
                                    </>
                                ) : (
                                    <></>
                                )}
                            </div>
                            <Container className='mt-3'>
                                <Row className='justify-content-md-center'>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField1'>
                                            <Form.Label>Game Name</Form.Label>
                                            <Form.Control type='text' name='gameName' value={gameForm.gameName} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField2'>
                                            <Form.Label>Game Owner</Form.Label>
                                            <Form.Control type='text' name='gameOwner' value={gameForm.gameOwner} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField1'>
                                            <Form.Label>Game Asset Name (NFT Name)</Form.Label>
                                            <Form.Control type='text' name='nftName' value={gameForm.nftName} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField2'>
                                            <Form.Label>Game Asset Symbol (NFT Symbol)</Form.Label>
                                            <Form.Control type='text' name='nftSymbol' value={gameForm.nftSymbol} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField1'>
                                            <Form.Label>Game URL (Frontend)</Form.Label>
                                            <Form.Control type='text' name='gameUrl' value={gameForm.gameUrl} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Video (optional)</Form.Label>
                                            <Form.Control
                                                type='file'
                                                accept='video/*'
                                                name='gameVideo'
                                                // value={gameForm.gameVideo}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Thumbnail</Form.Label>
                                            <Form.Control
                                                type='file'
                                                name='gameThumbnail'
                                                // value={gameForm.gameThumbnail}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Asset Creation Rules in .txt (optional) </Form.Label>
                                            <Form.Control
                                                type='file'
                                                accept='.txt'
                                                name='gameRules'
                                                // value={gameForm.gameRules}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Description (optional)</Form.Label>
                                            <Form.Control
                                                type='file'
                                                name='gameDescription'
                                                accept='.txt'
                                                // value={gameForm.gameThumbnail}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md='6'>
                                        <Form.Label>Price</Form.Label>
                                        <InputGroup className='mb-3'>
                                            <Form.Control
                                                type='text'
                                                pattern='[0-9]*\.?[0-9]*'
                                                name='price'
                                                value={gameForm.price}
                                                onChange={handleGameFormChange}
                                            />
                                            <InputGroup.Text>{selectedNetwork.nativeCurrency}</InputGroup.Text>
                                        </InputGroup>
                                        {isValidPrice && (
                                            <>
                                                <span className='text-danger'>* Please enter valid price</span>
                                            </>
                                        )}
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Id </Form.Label>
                                            <Form.Control type='text' name='gameId' value={gameForm.gameId} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Container>

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
                                                tab === 'crosschain'
                                                    ? '/main/explorer/' + transactionHash
                                                    : selectedNetwork.explorer + transactionHash
                                            }
                                            target='_blank'
                                            className='text-center'
                                        >
                                            <h6 className='text-primary mt-2'>
                                                {transactionHash} <img src='/assets/images/link.svg' height={15} width={25} className='mb-2' />
                                            </h6>
                                        </a>
                                    </>
                                )}
                            </div>
                        </Tab>
                        <Tab eventKey='crosschain' title='Cross Chain Game Creation'>
                            <div className='custom-select__selected d-flex justify-content-center align-items-center mt-4'>
                                <div>
                                    {selectedNetwork ? (
                                        <>
                                            <h5 className=' text-center'>Source Chain </h5>
                                            <div>
                                                <Dropdown className='custom-dropdown float-end'>
                                                    <Dropdown.Toggle variant='secondary' disabled>
                                                        <img
                                                            src={selectedNetwork.image}
                                                            alt={selectedNetwork.chainName}
                                                            className='network-image me-2'
                                                        />
                                                        {selectedNetwork.chainName} as Source Chain
                                                    </Dropdown.Toggle>
                                                </Dropdown>
                                            </div>
                                        </>
                                    ) : (
                                        <></>
                                    )}
                                </div>
                                <div className='ms-5'>
                                    {selectedTargetChain ? (
                                        <>
                                            <h5 className=' text-center'>Target Chain </h5>
                                            <Dropdown className='custom-dropdown float-end'>
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
                                                            <img src={network.image} alt={network.chainName} className='network-image me-2' />
                                                            {network.chainName}
                                                        </Dropdown.Item>
                                                    ))}
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </>
                                    ) : (
                                        <></>
                                    )}
                                </div>
                            </div>
                            <Container className='mt-3'>
                                <Row className='justify-content-md-center'>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField1'>
                                            <Form.Label>Game Name</Form.Label>
                                            <Form.Control type='text' name='gameName' value={gameForm.gameName} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField2'>
                                            <Form.Label>Game Owner</Form.Label>
                                            <Form.Control type='text' name='gameOwner' value={gameForm.gameOwner} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField1'>
                                            <Form.Label>Game Asset Name (NFT Name)</Form.Label>
                                            <Form.Control type='text' name='nftName' value={gameForm.nftName} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField2'>
                                            <Form.Label>Game Asset Symbol (NFT Symbol)</Form.Label>
                                            <Form.Control type='text' name='nftSymbol' value={gameForm.nftSymbol} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='inputField1'>
                                            <Form.Label>Game URL (Frontend)</Form.Label>
                                            <Form.Control type='text' name='gameUrl' value={gameForm.gameUrl} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Video (optional)</Form.Label>
                                            <Form.Control
                                                type='file'
                                                accept='video/*'
                                                name='gameVideo'
                                                // value={gameForm.gameVideo}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Thumbnail</Form.Label>
                                            <Form.Control
                                                type='file'
                                                name='gameThumbnail'
                                                // value={gameForm.gameThumbnail}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Asset Creation Rules in .txt (optional) </Form.Label>
                                            <Form.Control
                                                type='file'
                                                accept='.txt'
                                                name='gameRules'
                                                // value={gameForm.gameRules}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md={6}>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Description (optional)</Form.Label>
                                            <Form.Control
                                                type='file'
                                                name='gameDescription'
                                                accept='.txt'
                                                // value={gameForm.gameThumbnail}
                                                onChange={handleGameFormChange}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md='6'>
                                        <Form.Label>Price</Form.Label>
                                        <InputGroup className='mb-3'>
                                            <Form.Control
                                                type='text'
                                                pattern='[0-9]*\.?[0-9]*'
                                                name='price'
                                                value={gameForm.price}
                                                onChange={handleGameFormChange}
                                            />
                                            <InputGroup.Text>{selectedTargetChain.nativeCurrency}</InputGroup.Text>
                                        </InputGroup>
                                        {isValidPrice && (
                                            <>
                                                <span className='text-danger'>* Please enter valid price</span>
                                            </>
                                        )}
                                    </Col>
                                </Row>
                                <Row className='justify-content-md-center mt-3'>
                                    <Col md='6'>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Game Id </Form.Label>
                                            <Form.Control type='text' name='gameId' value={gameForm.gameId} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId='formFile' className='mb-3'>
                                            <Form.Label>Gas Price in GWEI (Optional)</Form.Label>
                                            <Form.Control type='text' name='gasPrice' value={gameForm.gasPrice} onChange={handleGameFormChange} />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Container>

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
                                                tab === 'crosschain'
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
                        </Tab>
                    </Tabs>
                </Modal.Body>
                <Modal.Footer>
                    {tab === 'crosschain' && (
                        <div className='w-100'>
                            <Accordion defaultActiveKey='0'>
                                <Accordion.Item>
                                    <Accordion.Header>Live Price Feeds</Accordion.Header>
                                    <Accordion.Body>
                                        <Form>
                                            <Row>
                                                <Col>
                                                    <Form.Group controlId='formInput1'>
                                                        <Form.Label>Today's {selectedNetwork.chainName}  {selectedNetwork.nativeCurrency} price</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            name='input1'
                                                            readOnly
                                                            value={latestPrice[selectedNetwork.nativeCurrency]}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                                <Col>
                                                    <Form.Group controlId='formInput2'>
                                                        <Form.Label>Today's {selectedTargetChain.chainName} {selectedTargetChain.nativeCurrency} price</Form.Label>
                                                        <Form.Control
                                                            type='text'
                                                            name='input2'
                                                            readOnly
                                                            value={latestPrice[selectedTargetChain.nativeCurrency]}
                                                        />
                                                    </Form.Group>
                                                </Col>
                                            </Row>
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
                                        </Form>
                                    </Accordion.Body>
                                </Accordion.Item>
                            </Accordion>
                        </div>
                    )}
                    {!transactionHash && (
                        <Button variant='success' disabled={!isFormValid() || isUploading} onClick={handleCreateGame}>
                            Create Game
                        </Button>
                    )}
                    <Button
                        variant='secondary'
                        onClick={() => {
                            transactionHash ? window.location.reload() : props.close();
                        }}
                    >
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default UploadGame;
