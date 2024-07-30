import React, { useContext, useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import BlockchainService from '../../blockchain/service';
import { NETWORKS } from '../../blockchain/networks';
import Modal from 'react-bootstrap/Modal';
import { findIngestor, getStreamKeys, getStreamURL, getVideos, uploadVideo } from '../../helpers/helpers';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';
import Dropdown from 'react-bootstrap/Dropdown';
import { FaCopy } from 'react-icons/fa';
import clipboardCopy from 'clipboard-copy';
import { FloatingLabel, Form, InputGroup, Button } from 'react-bootstrap';
import Livestream from '../live/Livestream';
import { socketContext } from '../../socket/SocketConnection';
import Toasts from '../../components/Toasts';
import { useNavigate } from 'react-router-dom';

function Home() {
    const naviagte = useNavigate()
    const { TGWServer } = useContext(socketContext);
    useEffect(() => {
        init();

    }, [TGWServer]);
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [accountData, setAccountData] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [streamId, setStreamId] = useState('stream_2hunjepqxd2vr0igve018h80h');
    const [apiKey, setApiKey] = useState('srvacc_wskaht3sbu40b05g3z91rhhfk');
    const [apiSecret, setApiSecret] = useState('n070qzi2uan4rs7cbq610w6kh55cux1z');
    const [ingestors, setIngestors] = useState([]);
    const [streamKey, setStreamKey] = useState('');
    const [streamServer, setStreamServer] = useState('');
    const [selectedIngestor, setSelectedIngestor] = useState('');
    const [show, setShow] = useState(false);
    const [toast, setToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [socketServer, setSocketServer] = useState();
    const [isLive, setIsLive] = useState(false);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [liveUsers, setAllLiveUsers] = useState(0);
    const [uploadVideoModal, setUploadVideoModal] = useState(false);
    const [videoId, setVideoId] = useState('');
    const [thumbnail, setThumbnail] = useState('');
    const [showToast, setShowToast] = useState(false);
    const init = async () => {
        let isLive = sessionStorage.getItem('isLive');
        let uri = sessionStorage.getItem('uri');
        setIsLive(isLive === 'true');
        
        if (TGWServer) {
            TGWServer.on('newComments', comment => {
                setNewComment(comment);
            });
            TGWServer.on('totalUsers', data => {
                let l = 0;
                data.map(item => {
                    l += item.live;
                });
                setAllLiveUsers(l);
                setAllUsers(data);
            });
        }

        if (await BlockchainService.enableEthereum()) {
            const signer = await BlockchainService.getSignerAccount();
            setAccountData(signer);
            const currentNetwork = await BlockchainService.getCurrentNetwork();
            setSelectedNetwork(currentNetwork);
            if (TGWServer) {
                TGWServer.emit('userConnected', {
                    address: signer.address,
                    network: currentNetwork,
                    live: isLive === 'true' ? true : false,
                    uri: uri
                });
            }
        }
    };

    const findIngestors = async () => {
        try {
            const res = await findIngestor(apiKey, apiSecret);
            setIngestors(res);
        } catch (e) {
            setToastMessage(e.response.data.message);
            setToast(true);
            setTimeout(() => {
                setToast(false);
            }, 2000);
        }
    };

    const getStreamKey = async () => {
        try {
            const res = await getStreamKeys(streamId, apiKey, apiSecret, selectedIngestor);
            setStreamKey(res.stream_key);
            setStreamServer(res.stream_server);
        } catch (e) {
            console.log(e);
            setToastMessage(e);
            setToast(true);
            setTimeout(() => {
                setToast(false);
            }, 2000);
        }
    };

    const startLive = async () => {
        sessionStorage.setItem('isLive', true);
        const res = await getStreamURL(streamId, apiKey, apiSecret);
        setIsLive(true);
        sessionStorage.setItem('uri', res.player_uri);

        TGWServer.emit('userConnected', {
            address: accountData.address,
            network: selectedNetwork,
            live: true,
            uri: res.player_uri
        });
        setShow(false);
    };

    const stopLive = () => {
        sessionStorage.setItem('isLive', false);
        sessionStorage.removeItem('uri');
        setIsLive(false);
        TGWServer.emit('userConnected', {
            address: accountData.address,
            network: selectedNetwork,
            live: false,
            uri: ''
        });
        setShow(false);
    };

    const [liveModal, setLiveModal] = useState(false);
    const [liveURI, setLiveURI] = useState('');
    const [streamer, setStreamer] = useState({});
    const [description, setDescription] = useState('');
    const watchLive = item => {
        // const url = '/main/livestream'; // the path you want to navigate to
        // const params = new URLSearchParams({ data: uri }).toString();
        // window.open(`${url}?${params}`, '_blank');
        setStreamer(item);
        setLiveURI(item.uri);
        setLiveModal(true);
    };
    const sendComment = data => {
        TGWServer.emit('newComment', {
            sender: accountData.address,
            data: data
        });
    };
    const copyToClipboard = text => {
        clipboardCopy(text);
    };
    const handleUploadVideo = async () => {
        try {
            const res = await uploadVideo(videoId, { owner: accountData.address, description: description }, thumbnail);
            setUploadVideoModal(false);
            setShowToast(true);
            setToastMessage(res);
        } catch (e) {
            setUploadVideoModal(false);
            setShowToast(true);
            if (e.message.includes('user rejected action ')) {
                setToastMessage('User Rejected the action');
            } else {
                setToastMessage(e.message);
            }
        }
    };
    const [isValid, setIsValid] = useState(false);

    const pattern = /^video_.{26}$/;

    const handleInputChange = e => {
        const value = e.target.value;
        console.log(value);
        if (pattern.test(value)) {
            console.log('true');
            setIsValid(true);
        } else {
            setIsValid(false);
        }
    };
    return (
        <div>
            <h3 className='text-center'>
                Welcome to the <span className='text-primary'>Theta Gaming World</span> Platform
            </h3>
            <h5 className='text-center mt-3'> Immerse yourself in the ultimate gaming experience and embark on your next adventure with us!</h5>

            <div className='carousel-sliding-container mt-3'>
                <div className='carousel-sliding-content mt-4'>
                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                        <div key={chainId} className='carousel-sliding-item'>
                            <img src={network.image} alt={network.chainName} className='carousel-sliding-image' />
                            <p className='mt-2' style={{ fontSize: '12px' }}>
                                {/* {network.chainName} */}
                            </p>
                        </div>
                    ))}
                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                        <div key={chainId} className='carousel-sliding-item'>
                            <img src={network.image} alt={network.chainName} className='carousel-sliding-image' />
                            <p className='mt-2' style={{ fontSize: '12px' }}>
                                {/* {network.chainName} */}
                            </p>
                        </div>
                    ))}
                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                        <div key={chainId} className='carousel-sliding-item'>
                            <img src={network.image} alt={network.chainName} className='carousel-sliding-image' />
                            <p className='mt-2' style={{ fontSize: '12px' }}>
                                {/* {network.chainName} */}
                            </p>
                        </div>
                    ))}
                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                        <div key={chainId} className='carousel-sliding-item'>
                            <img src={network.image} alt={network.chainName} className='carousel-sliding-image' />
                            <p className='mt-2' style={{ fontSize: '12px' }}>
                                {/* {network.chainName} */}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <div className='row mt-5'>
                <div className='col-12'>
                    <div className='card widget-inline'>
                        <div className='card-body p-0'>
                            <div className='row g-0'>
                                {/* <div className='col-sm-6 col-xl-3'>
                                    <div className='card shadow-none m-0'>
                                        <div className='card-body text-center'>
                                            <i className='mdi mdi-nintendo-game-boy text-muted fs-1'></i>
                                            <h3>
                                                <span>29</span>
                                            </h3>
                                            <p className='text-muted font-15 mb-0'>Total Games</p>
                                        </div>
                                    </div>
                                </div> */}

                                {/* <div className='col-sm-6 col-xl-3'>
                                    <div className='card shadow-none m-0 border-start'>
                                        <div className='card-body text-center'>
                                            <i className='mdi mdi-treasure-chest text-muted fs-1'></i>
                                            <h3>
                                                <span>715</span>
                                            </h3>
                                            <p className='text-muted font-15 mb-0'>Total NFTs</p>
                                        </div>
                                    </div>
                                </div> */}

                                <div className='col-sm-6 col-xl-6'>
                                    <div className='card shadow-none m-0 border-start'>
                                        <div className='card-body text-center'>
                                            <i className='dripicons-user-group text-muted fs-1'></i>
                                            <h3>
                                                <span>{allUsers.length}</span>
                                            </h3>
                                            <p className='text-muted font-15 mb-0'>Users Online</p>
                                        </div>
                                    </div>
                                </div>

                                <div className='col-sm-6 col-xl-6'>
                                    <div className='card shadow-none m-0 border-start'>
                                        <div className='card-body text-center'>
                                            <i className='mdi mdi-video-image text-muted fs-1'></i>
                                            <h3>
                                                <span>{liveUsers}</span>
                                            </h3>
                                            <p className='text-muted font-15 mb-0'>Users on Livestream</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className='d-flex align-items-center mt-5'>
                <div>
                    <h3 className='mt-3'>Active Users:</h3>
                </div>
                <div className='ms-auto mt-3'>
                <Button variant='info' className='me-3' onClick={() => naviagte('/main/videos')}>
                        Watch Edge Videos
                    </Button>
                    <Button variant='info' className='me-3' onClick={() => setUploadVideoModal(true)}>
                        Upload Video
                    </Button>
                    <Button variant={!isLive ? 'success' : 'danger'} onClick={() => setShow(true)}>
                        <span className='mdi mdi-video-image me-2'></span>
                        {isLive ? 'Stop Live' : 'Go Live'}
                    </Button>
                </div>
            </div>
            <table className='table table-hover table-centered mt-4 table-custom'>
                <thead>
                    <tr style={{ textAlign: 'center' }}>
                        <th>S.No</th>
                        <th>User</th>
                        <th>Chain</th>
                        <th>Status</th>
                        <th>Live</th>
                    </tr>
                </thead>
                <tbody>
                    {allUsers.map((item, index) => (
                        <tr key={index} style={{ textAlign: 'center' }}>
                            <td>{index + 1}</td>
                            <td>{item.address} </td>
                            <td>
                                <img src={item.network.image} width={20} height={20} className='me-2' /> {item.network.chainName}
                            </td>
                            <td>
                                <span className='badge bg-success'>Online</span>
                            </td>
                            <td style={{ fontSize: '16px' }}>
                                {item.live ? (
                                    <span
                                        className='mdi mdi-eye-settings'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => watchLive(item)}
                                        // onClick={() => window.open(item.uri, '_blank')}
                                    >
                                        Live
                                    </span>
                                ) : (
                                    <span className='mdi mdi-eye-off-outline'></span>
                                )}
                            </td>
                            <td>{item.timestamp}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={show}>
                <Modal.Header closeButton>
                    <Modal.Title>Go Live!!!</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <FloatingLabel label='Enter the Stream Id' className='mb-3'>
                        <Form.Control type='password' placeholder='Stream Id' value={streamId} onChange={e => setStreamId(e.target.value)} />
                    </FloatingLabel>
                    <FloatingLabel label='Enter the API Key' className='mb-3'>
                        <Form.Control type='password' placeholder='API Key' value={apiKey} onChange={e => setApiKey(e.target.value)} />
                    </FloatingLabel>
                    <FloatingLabel label='Enter the API Secret' className='mb-3'>
                        <Form.Control type='password' placeholder='API Secret' value={apiSecret} onChange={e => setApiSecret(e.target.value)} />
                    </FloatingLabel>
                    {ingestors.length === 0 && (
                        <div className='d-flex justify-content-center align-items-center'>
                            <Button variant='primary' onClick={findIngestors}>
                                Find Ingestors
                            </Button>
                        </div>
                    )}
                    {ingestors.length > 0 && (
                        <>
                            <Dropdown>
                                <Dropdown.Toggle variant='secondary' id='dropdown-basic'>
                                    {selectedIngestor ? selectedIngestor : 'Select Ingestor'}
                                </Dropdown.Toggle>

                                <Dropdown.Menu>
                                    {ingestors.map((item, index) => (
                                        <Dropdown.Item key={index} onClick={() => setSelectedIngestor(item.id)}>
                                            {item.id}
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            </Dropdown>

                            {selectedIngestor && !streamKey && (
                                <div className='d-flex justify-content-center align-items-center mt-4'>
                                    <Button variant='primary' onClick={getStreamKey}>
                                        Get Stream Key
                                    </Button>
                                </div>
                            )}
                        </>
                    )}

                    {streamServer && (
                        <>
                            <FloatingLabel label='Stream Server' className='mb-3 mt-3'>
                                <InputGroup>
                                    <Form.Control type='password' placeholder='Stream Server' value={streamServer} readOnly />
                                    <Button variant='outline-secondary' onClick={() => copyToClipboard(streamServer)}>
                                        <FaCopy />
                                    </Button>
                                </InputGroup>
                            </FloatingLabel>
                            <FloatingLabel label='Stream Key' className='mb-3'>
                                <InputGroup>
                                    <Form.Control type='password' placeholder='Stream Key' value={streamKey} readOnly />
                                    <Button variant='outline-secondary' onClick={() => copyToClipboard(streamKey)}>
                                        <FaCopy />
                                    </Button>
                                </InputGroup>
                            </FloatingLabel>
                        </>
                    )}
                    {toast && (
                        <div className='text-danger text-center'>
                            <h6>{toastMessage}</h6>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {isLive && (
                        <Button variant='danger'>
                            <span className='mdi mdi-video-image' onClick={stopLive}>
                                {' '}
                                Stop Live{' '}
                            </span>
                        </Button>
                    )}
                    <Button variant='success' disabled={!streamKey}>
                        <span className='mdi mdi-video-image' onClick={startLive}>
                            {' '}
                            Start Live{' '}
                        </span>
                    </Button>
                    <Button variant='secondary' onClick={() => setShow(false)}>
                        close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Modal show={uploadVideoModal}>
                <Modal.Header closeButton>
                    <Modal.Title>Upload Video</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <h6>
                        Upload your Recorded Video{' '}
                        <a href='https://www.thetaedgecloud.com/dashboard/video/videos' target='_blank'>
                            {' '}
                            here.
                        </a>
                    </h6>
                    <FloatingLabel label='Enter the Uploaded Video Id' className='mb-3'>
                        <Form.Control
                            type='password'
                            placeholder='Stream Id'
                            value={videoId}
                            onChange={e => {
                                setVideoId(e.target.value);
                                handleInputChange(e);
                            }}
                        />
                        <Form.Group controlId='formFile' className='mb-3 mt-3'>
                            <Form.Label>Upload Thumbnail</Form.Label>
                            <Form.Control
                                type='file'
                                // value={gameForm.gameThumbnail}
                                onChange={e => setThumbnail(e.target.files[0])}
                            />
                        </Form.Group>
                        <Form.Group className='mb-3' controlId='exampleForm.ControlTextarea1'>
                            <Form.Label>Description</Form.Label>
                            <Form.Control as='textarea' rows={3} value={description} onChange={(e) =>setDescription(e.target.value)} />
                        </Form.Group>
                    </FloatingLabel>
                    {!isValid && videoId && <p className='text-danger'>Not a valid Video Id</p>}

                    {toast && (
                        <div className='text-danger text-center'>
                            <h6>{toastMessage}</h6>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='success' disabled={!isValid}>
                        <span className='mdi mdi-video-image' onClick={handleUploadVideo}>
                            {' '}
                            Upload{' '}
                        </span>
                    </Button>
                    <Button variant='secondary' onClick={() => setUploadVideoModal(false)}>
                        close
                    </Button>
                </Modal.Footer>
            </Modal>

            <Livestream
                show={liveModal}
                close={() => setLiveModal(false)}
                sendComment={data => sendComment(data)}
                uri={liveURI}
                newComment={newComment}
                streamer={streamer}
            />
            <Toasts show={showToast} message={toastMessage} close={() => setShowToast(false)} />
        </div>
    );
}

export default Home;
