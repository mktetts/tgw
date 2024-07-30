import React, { useCallback, useEffect, useState } from 'react';

import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import BlockchainService from '../../blockchain/service';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import JSZip from 'jszip';
import { useDropzone } from 'react-dropzone';
import { saveAs } from 'file-saver';
import Col from 'react-bootstrap/Col';
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import InputGroup from 'react-bootstrap/InputGroup';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Tooltip from 'react-bootstrap/Tooltip';
import Spinners from '../../components/Spinners';
import { uploadNFT } from '../../helpers/helpers';
import { NETWORKS } from '../../blockchain/networks';
import io from 'socket.io-client';
import { Accordion, Dropdown } from 'react-bootstrap';
import ProviderService from '../../blockchain/providerService';

const MintNFT = props => {
    const [accountData, setAccountData] = useState({});
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [isValidPrice, setIsValidPrice] = useState(false);
    const [price, setPrice] = useState(0);
    const [file, setFile] = useState(null);
    const [selectedTargetChain, setSelectedTargetChain] = useState({});
    const [isOpen, setIsOpen] = useState(false);
    const [gasPrice, setGasprice] = useState('');
    const [latestPrice, setLatestPrice] = useState({});
    const [exchangedPrice, setExchaingedPrice] = useState('');
    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        await BlockchainService.enableEthereum()
        const signer = await ProviderService.getSignerAccount();
        setAccountData(signer);
        setSellerAccount(signer.address);
        setSelectedNetwork(await ProviderService.getCurrentNetwork());
        setSelectedTargetChain(await ProviderService.getCurrentNetwork());
        setGasprice(await BlockchainService.getGasPrice(await BlockchainService.getCurrentNetwork()));

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
    };

    const onDrop = useCallback(async acceptedFiles => {
        const zip = new JSZip();

        // Group files by their directory
        const filesGroupedByDir = acceptedFiles.reduce((acc, file) => {
            console.log(file);
            const pathParts = file.path.split('/');
            const fileName = pathParts.pop();
            const dir = pathParts.join('/');
            if (!acc[dir]) {
                acc[dir] = [];
            }
            acc[dir].push(file);
            return acc;
        }, {});

        // Add files to the zip
        Object.keys(filesGroupedByDir).forEach(dir => {
            const files = filesGroupedByDir[dir];
            files.forEach(file => {
                zip.file(`${dir}/${file.name}`, file);
            });
        });
        console.log(zip);
        // // Generate zip and trigger download
        zip.generateAsync({ type: 'blob' }).then(content => {
            console.log(content)
            setFile(content);
            // saveAs(content, 'uploaded_folder.zip');
        });
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        directory: true,
        webkitdirectory: 'true',
        mozdirectory: 'true',
        multiple: true
    });

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

    const [isNFTUploading, setIsNFTUploading] = useState(false);
    const [spinnerMessage, setSpinnerMessage] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const [tab, setTab] = useState('');
    const [sellerAccount, setSellerAccount] = useState(accountData.address);
    const handleMintNFT = async () => {
        console.log(props.gameId);
        setIsNFTUploading(true);
        setSpinnerMessage('NFT is Uploading to Edge Store');
        let res = await uploadNFT(file, accountData.address + '.zip');
        if (!res.key) return;
        setSpinnerMessage('Minting NFT');
        if (tab === 'crosschain') {
            res = await BlockchainService.crossChainMintNFT({
                targetChainId: selectedTargetChain.chainId,
                receiverAddress: selectedTargetChain.nftAddress,
                gameId: props.gameId,
                seller: sellerAccount,
                storekey: res.key,
                price: price,
                gasPrice: gasPrice
            });
        } else {
            res = await BlockchainService.sameChainMintNFT({
                gameId: props.gameId,
                seller: sellerAccount,
                storekey: res.key,
                price: price
            });
        }
        // await new Promise(r => setTimeout(r, 2000));
        if (!res.hash) return;
        setIsNFTUploading(false);
        setTransactionHash(res.hash);
        setSpinnerMessage('Minted Successfully');
    };

    const handleSelectedTargetChain = async network => {
        setSelectedTargetChain(network);
        const gasPrice = await BlockchainService.getGasPrice(network);
        setGasprice(gasPrice);
    };

    const [livePrice, setLivePrice] = useState('');
    const calculateLiveExchange = async value => {
        setLivePrice(value);
        let source = latestPrice[selectedNetwork.nativeCurrency];
        let destination = latestPrice[selectedTargetChain.nativeCurrency];
        setExchaingedPrice((source / destination) * value);
    };
    return (
        <Modal show={props.show} onHide={props.handleClose} backdrop='static' keyboard={false} size='lg'>
            <Modal.Header>
                <Modal.Title>Mint Your Creation</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Tabs defaultActiveKey='samechain' id='fill-tab-example' className='mb-3' fill variant='pills' onSelect={k => setTab(k)}>
                    <Tab eventKey='samechain' title='Same Chain Mint'>
                        <div className='custom-select__selected d-flex justify-content-center align-items-center'>
                            {selectedNetwork ? (
                                <>
                                    <h6>
                                        Target Chain:{' '}
                                        <img src={selectedNetwork.image} alt={selectedNetwork.chainName} className='network-image me-2' />
                                        {selectedNetwork.chainName}
                                    </h6>
                                </>
                            ) : (
                                <></>
                            )}
                        </div>
                        <br />
                        <Form>
                            <Form.Group as={Row} className='mb-3' controlId='formPlaintextEmail'>
                                <Form.Label column sm='2'>
                                    NFT Owner
                                </Form.Label>
                                <Col sm='6'>
                                    <Form.Control value={sellerAccount} onChange={e => setSellerAccount(e.target.value)} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className='mb-3' controlId='formPlaintext'>
                                <Form.Label column sm='2'>
                                    Enter Price
                                </Form.Label>
                                <Col sm='4'>
                                    <InputGroup className='mb-3'>
                                        <Form.Control type='text' pattern='[0-9]*\.?[0-9]*' onChange={handlePriceValueChange} />
                                        <InputGroup.Text>{selectedNetwork.nativeCurrency}</InputGroup.Text>
                                    </InputGroup>
                                    {isValidPrice && (
                                        <>
                                            <span className='text-primary'>*</span>
                                            Please enter valid price
                                        </>
                                    )}
                                </Col>

                                <Form.Group as={Row} className='mb-3 mt-2' controlId='formPlaintextEmail'>
                                    <Form.Label  column sm='2'>Upload NFT .zip file  <a href='/documentation/doc3' target='_blank'>see here.</a></Form.Label>
                                    <Col sm='5'>
                                         <Form.Control
                                                type='file'
                                                name='gameDescription'
                                                accept='.txt'
                                                // value={gameForm.gameThumbnail}
                                                onChange={(e) => setFile(e.target.files[0])}
                                            /> 
                                    </Col>
                                </Form.Group>
                            </Form.Group>
{/* 
                            <div
                                {...getRootProps()}
                                style={{
                                    border: '1px dashed black',
                                    padding: '20px',
                                    textAlign: 'center',
                                    borderRadius: '25px',
                                    cursor: 'pointer'
                                }}
                            >
                                <input {...getInputProps()} webkitdirectory='true' mozdirectory='true' directory='true' />
                                {file ? <p>Asset Uploaded</p> : <p>Please Drag and Drop your NFT containing folder</p>}
                            </div> */}
                        </Form>
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
                                            {transactionHash} <img src='/assets/images/link.svg' height={15} width={25} className='mb-2' />
                                        </h6>
                                    </a>
                                </>
                            )}
                        </div>
                    </Tab>
                    <Tab eventKey='crosschain' title='Cross Chain Mint'>
                        <div className='custom-select__selected d-flex justify-content-center align-items-center mt-4'>
                            <div>
                                {selectedNetwork ? (
                                    <>
                                        <h5 className=' text-center'>Source Chain </h5>
                                        <div>
                                            <Dropdown className='custom-dropdown float-end'>
                                                <Dropdown.Toggle variant='secondary' disabled>
                                                    <img src={selectedNetwork.image} alt={selectedNetwork.chainName} className='network-image me-2' />
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
                                                    <Dropdown.Item key={chainId} onClick={() => handleSelectedTargetChain(network)} className='mt-2'>
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
                        <Form>
                            <Form.Group as={Row} className='mb-3 mt-4' controlId='formPlaintextEmail'>
                                <Form.Label column sm='2'>
                                    NFT Owner
                                </Form.Label>
                                <Col sm='6'>
                                    <Form.Control value={sellerAccount} onChange={e => setSellerAccount(e.target.value)} />
                                </Col>
                            </Form.Group>
                            <Form.Group as={Row} className='mb-3' controlId='formPlaintext'>
                                <Form.Label column sm='2'>
                                    Enter Price
                                </Form.Label>
                                <Col sm='4'>
                                    <InputGroup className='mb-3'>
                                        <Form.Control type='text' pattern='[0-9]*\.?[0-9]*' onChange={handlePriceValueChange} />
                                        <InputGroup.Text>{selectedTargetChain.nativeCurrency}</InputGroup.Text>
                                    </InputGroup>
                                    {isValidPrice && (
                                        <>
                                            <span className='text-primary'>*</span>
                                            Please enter valid price
                                        </>
                                    )}
                                </Col>
                                <Form.Group as={Row} className='mb-3 mt-4' controlId='formPlaintextEmail'>
                                    <Form.Label  column sm='2'>Gas Price in GWEI (Optional)</Form.Label>
                                    <Col sm='6'>
                                        <Form.Control type='text' name='gasPrice' value={gasPrice} onChange={e => setGasprice(e.target.value)} />
                                    </Col>
                                </Form.Group>

                                <Form.Group as={Row} className='mb-3 mt-4' controlId='formPlaintextEmail'>
                                    <Form.Label  column sm='2'>Upload NFT .zip file  <a href='/documentation/doc3' target='_blank'>see here.</a></Form.Label>
                                    <Col sm='6'>
                                         <Form.Control
                                                type='file'
                                                name='gameDescription'
                                                accept='.txt'
                                                // value={gameForm.gameThumbnail}
                                                onChange={(e) => setFile(e.target.files[0])}
                                            />
                                    </Col>
                                </Form.Group>
                            </Form.Group>

                            {/* <div
                                {...getRootProps()}
                                style={{
                                    border: '1px dashed black',
                                    padding: '20px',
                                    textAlign: 'center',
                                    borderRadius: '25px',
                                    cursor: 'pointer'
                                }}
                            >
                                <input {...getInputProps()} webkitdirectory='true' mozdirectory='true' directory='true' />
                                {file ? <p>Asset Uploaded</p> : <p>Please Drag and Drop your NFT containing folder</p>}
                            </div> */}
                        </Form>
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
                                        href={tab === 'crosschain' ? '/main/explorer/' + transactionHash : selectedNetwork.explorer + transactionHash}
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
                                                    <Form.Label>
                                                        Today's {selectedNetwork.chainName} {selectedNetwork.nativeCurrency} price
                                                    </Form.Label>
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
                                                    <Form.Label>
                                                        Today's {selectedTargetChain.chainName} {selectedTargetChain.nativeCurrency} price
                                                    </Form.Label>
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
                    <Button variant='success' onClick={handleMintNFT} disabled={!price || !file || isNFTUploading}>
                        Mint
                    </Button>
                )}
                <Button variant='secondary' onClick={() => window.location.reload()}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
const renderTooltip = props => (
    <Tooltip id='button-tooltip' {...props}>
        Simple tooltip
    </Tooltip>
);
export default MintNFT;
