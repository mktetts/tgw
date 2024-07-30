import React, { useEffect, useRef, useState } from 'react';
import Topbar from '../components/Topbar';
import { NETWORKS } from '../blockchain/networks';
import io from 'socket.io-client';
import { Modal, Button } from 'react-bootstrap';
import BlockchainService from '../blockchain/service';
import xImage from '/src/assets/images/base.svg';
import oImage from '/src/assets/images/polygon.svg';
import AssetModal from './AssetModal';
import html2canvas from 'html2canvas';
import { useNavigate } from 'react-router-dom';

const initialBoard = Array(9).fill(null);
const calculateWinner = squares => {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    if (squares.every(square => square !== null)) {
        return 'Tie';
    }

    return null;
};

const Square = ({ value, onClick, isClickable, mine, opponent }) => {
    const renderImage = value => {
        if (value === 'X') {
            return <img src={mine[0]} alt='X' height={70} width={70} />;
        } else if (value === 'O') {
            return <img src={opponent[0]} alt='O' height={70} width={70} />;
        } else {
            return null;
        }
    };

    return (
        <button className='square' onClick={onClick} disabled={!isClickable}>
            {renderImage(value)}
        </button>
    );
};

const Board = ({ squares, onClick, currentPlayer, mine, opponent }) => {
    return (
        <div className='gameboard'>
            {squares.map((square, i) => (
                <Square
                    key={i}
                    value={square}
                    onClick={() => onClick(i)}
                    isClickable={!square && (currentPlayer === 'X' || currentPlayer === 'O')}
                    mine={mine}
                    opponent={opponent}
                />
            ))}
        </div>
    );
};

function Main() {
    const navigate = useNavigate();
    const [socket, setsocket] = useState('');
    const [info, setInfo] = useState('');
    const [allPlayers, setAllPlayers] = useState([]);
    const [myId, setMyId] = useState('');
    const [peerInstance, setPeerInstace] = useState(undefined);
    const [DidName, setDidName] = useState('');
    const [socketInstance, setSocketInstance] = useState(undefined);
    const [callModal, openCallModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isCall, setIsCall] = useState(false);
    const [isRequest, setIsRequest] = useState(false);
    const [remotePeer, setRemotePeer] = useState('');
    const [connectionInstance, setConnectionInstance] = useState(undefined);
    const [gameId, setRoomId] = useState('');
    const [gameModal, setGameModal] = useState(false);
    const [playerProfile, setPlayerProfile] = useState([]);
    const [playerExited, setPlayerExited] = useState(false);
    const [defaultAsset, setDefaultAsset] = useState({});
    const [hasPurchaed, setHasPurchased] = useState(0);
    const [me, setMe] = useState('');
    useEffect(() => {
        let userInfo = JSON.parse(sessionStorage.getItem('myinfo'));
        const socket = io(import.meta.env.VITE_APP_GSME_SERVER);
        setsocket(socket);
        socket.on('intitial-connect', async data => {
            setMyId(data.id);
            await BlockchainService.enableEthereum();
            const net = await BlockchainService.getCurrentNetwork();
            const purchased = await BlockchainService.hasPurchasedGame(
                import.meta.env.VITE_APP_GAME_ID,
                import.meta.env.VITE_APP_GAME_CHAIN,
                import.meta.env.VITE_APP_GAME_RPC
            );
            console.log(purchased);
            setHasPurchased(purchased ? 1 : 2);
            if (!purchased) return;
            let dataa = {
                username: userInfo.username,
                network: net,
                gameId: userInfo.gameId
            };
            console.log(dataa);
            setInfo(dataa);
            socket.emit('store_client_info', dataa);
        });
        socket.on('clients-total', clients => {
            setAllPlayers(clients);
            console.log('All connected clients:', clients);
        });
        socket.on('private_message', data => {
            if (data.message.type === 'request') {
                setIsCall(true);
                openCallModal(true);
                console.log(data);
                setPlayerProfile(data.message);
                setModalMessage(data.message);
            } else if (data.message.type === 'accept') {
                console.log(data);

                setModalMessage('Requst Accepted');
                setPlayerProfile(prevPlayerProfile => ({
                    ...prevPlayerProfile,
                    ...data.message
                }));
                openCallModal(false);
                setTimeout(() => {
                    setGameModal(true);
                }, 1000);
            } else if (data.message.type === 'decline') {
                setModalMessage('Player Declined the Request');
                setTimeout(() => {
                    window.location.reload();
                }, 3000);
            }
        });

        socket.on('room-update', clients => {
            console.log('Clients in room:', clients);
        });

        socket.on('message', data => {
            console.log('New message:', data);
        });

        socket.on('game_move', data => {
            if (data.message.type === 'move') {
                remotePlayerMove(data.message);
            }
        });
        socket.on('exit_game', data => {
            if (data.message.type === 'exit_game') {
                console.log(data);
                setPlayerExited(true);
                setTimeout(() => {
                    window.location.reload();
                }, 5000);
            }
        });
    }, []);

    const handleRequestPlay = async player => {
        openCallModal(true);
        setIsRequest(true);
        console.log(player);
        setPlayerProfile(player);
    };

    const [confirmCall, setConfirmCall] = useState(false);

    const handleSendRequest = async () => {
        console.log(playerProfile);
        setModalMessage('Request Sent.. Waiting for Response...');
        setMe('first');
        socket.emit('private_message', {
            target_id: playerProfile.id,
            message: {
                type: 'request',
                username: info.username,
                chainName: info.network.chainName,
                id: myId,
                gameId: gameId,
                assets: defaultAsset.images
            }
        });
    };

    const handleCall = res => {
        // openCallModal(false);
        socket.emit('private_message', {
            target_id: modalMessage.id,
            message: {
                type: res,
                assets: defaultAsset.images
            }
        });
        if (res === 'decline') {
            window.location.reload();
        } else {
            setMe('second');
            // const mine = defaultAsset
            // console.log(mine)
            // setDefaultAsset(playerProfile)
            // setPlayerProfile(mine)
            // setPlayerProfile(modalMessage);
            openCallModal(false);
            setTimeout(() => {
                setGameModal(true);
            }, 1000);
        }
    };

    const [squares, setSquares] = useState(initialBoard);
    const [xIsNext, setXIsNext] = useState(true);

    const handleClick = i => {
        console.log(squares);
        const newSquares = [...squares];
        if (calculateWinner(newSquares) || newSquares[i]) {
            return;
        }
        // if ((xIsNext && info.username !== 'X') || (!xIsNext && info.username !== 'O')) {
        //     // setTurnMessage("It's your opponent's turn!");
        //     return;
        // }
        newSquares[i] = xIsNext ? 'X' : 'O';
        setSquares(newSquares);
        setXIsNext(!xIsNext);
        console.log(playerProfile);
        socket.emit('game_move', {
            target_id: playerProfile.id,
            message: {
                type: 'move',
                squares: newSquares,
                xIsNext: !xIsNext
            }
        });
    };

    const remotePlayerMove = data => {
        setSquares(data.squares);
        setXIsNext(data.xIsNext);
    };

    const exitGame = () => {
        socket.emit('exit_game', {
            target_id: playerProfile.id,
            message: {
                type: 'exit_game'
            }
        });
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const winner = calculateWinner(squares);
    let status;
    if (winner === 'Tie') {
        status = `It's a Tie!`;
    } else if (winner) {
        if (winner === 'X' && me === 'first') status = `Winner: ${info.username}`;
        else if (winner === 'X' && me === 'second') status = `Winner: ${playerProfile.username}`;
        else if (winner === 'O' && me === 'first') status = `Winner: ${playerProfile.username}`;
        else if (winner === 'O' && me === 'second') status = `Winner: ${info.username}`;
    } else {
        if (xIsNext && me === 'first') status = `Next player: ${info.username}`;
        else if (xIsNext && me === 'second') status = `Next player: ${playerProfile.username}`;
        else if (!xIsNext && me === 'first') status = `Next player: ${playerProfile.username}`;
        else if (!xIsNext && me === 'second') status = `Next player: ${info.username}`;
        // status = `Next player: ${xIsNext ? info.username : playerProfile.username}`;
    }

    const [assetModal, setAssetModal] = useState(false);

    const divRef = useRef();
    const [showModal, setShowModal] = useState(false);
    const [screenshot, setScreenshot] = useState('');

    const takeScreenshot = () => {
        html2canvas(divRef.current).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            setScreenshot(imgData);
            setShowModal(true);
        });
    };

    const handlePublish = () => {
        // Add your publish logic here
        console.log('Publishing screenshot...');
        setShowModal(false);
    };
    return (
        <>
            {hasPurchaed === 1 ? (
                <>
                    <div>
                        <Topbar />
                        <div
                            className='container-fluid'
                            style={{
                                paddingLeft: '90px',
                                paddingRight: '80px',
                                paddingBottom: '300px',
                                marginTop: '3%'
                            }}
                        >
                            <div className='row'>
                                <div className='col-12'>
                                    <div className='page-title-box'>
                                        <h4></h4>
                                    </div>
                                </div>
                            </div>
                            <div className='row'>
                                <div className='col-12 d-flex justify-content-center align-items-center'>
                                    <div className='page-title-box text-center'>
                                        <p
                                            style={{
                                                fontSize: '25px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Unleash Your Inner Warrior in the <span className='text-primary'>Cross Chain</span> Digital Arena of
                                            Champions
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '23px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Welcome to <span className='text-primary'>Tic Tac Toe</span> Game with your{' '}
                                            <span className='text-primary'>Own NFTs</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <br />
                            <div className='carousel-container mt-5'>
                                <div className='carousel-content'>
                                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                                        <div key={chainId} className='carousel-item'>
                                            <img src={network.image} alt={network.chainName} className='carousel-image' />
                                            <p className='mt-2'>{network.chainName}</p>
                                        </div>
                                    ))}
                                    {Object.entries(NETWORKS).map(([chainId, network]) => (
                                        <div key={chainId} className='carousel-item'>
                                            <img src={network.image} alt={network.chainName} className='carousel-image' />
                                            <p className='mt-2'>{network.chainName}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <br />
                            <h3>
                                Default Asset : <span className='text-primary'>{defaultAsset?.name}</span>
                            </h3>
                            <div className='text-center mt-3'>
                                <h3> Available Online Player</h3>
                            </div>
                            <button className='btn btn-info float-end mb-3 ms-3' onClick={() => setAssetModal(true)}>
                                Your Assets
                            </button>
                            <table className='table table-hover table-centered mt-4'>
                                <thead>
                                    <tr style={{ textAlign: 'center' }}>
                                        <th>S.No</th>
                                        <th>Name</th>
                                        <th>Chain</th>
                                        <th> Status </th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPlayers.map((item, index) => (
                                        <tr key={index} style={{ textAlign: 'center' }}>
                                            <td>{index + 1}</td>

                                            <td>
                                                {item.username} {item.id == myId && <span style={{ color: 'blue' }}>(you)</span>}
                                            </td>
                                            <td>
                                                <img src={item.network?.image} width={20} height={15} /> {item.network.chainName}
                                            </td>
                                            <td style={{ fontSize: '18px' }}>
                                                <span className='badge bg-success'>Online</span>
                                            </td>

                                            <td>
                                                <button
                                                    type='button'
                                                    className='btn btn-primary'
                                                    style={{ borderRadius: '20px' }}
                                                    onClick={() => handleRequestPlay(item)}
                                                    disabled={item.id == myId}
                                                >
                                                    Request to Play
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <Modal show={callModal} backdrop='static' keyboard={false} size='lg'>
                            <Modal.Header>
                                <Modal.Title>Request Confirmation</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                {isRequest && (
                                    <>
                                        <div>
                                            <div
                                                className='mt-1 mb-3 ms-4'
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <label className='form-label me-3'>Enter Room Id</label>
                                                <input
                                                    type='text'
                                                    id='simpleinput'
                                                    autoComplete='off'
                                                    name='name'
                                                    value={gameId}
                                                    onChange={e => setRoomId(e.target.value)}
                                                />
                                            </div>
                                            {modalMessage && <h5 className='mb-5 mt-5 text-center'>{modalMessage}</h5>}
                                        </div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <button type='button' className='btn btn-success' onClick={handleSendRequest} disabled={confirmCall}>
                                                Requst Now
                                            </button>
                                            <button
                                                type='button'
                                                className='btn btn-secondary'
                                                style={{ marginLeft: '20px' }}
                                                onClick={() => {
                                                    window.location.reload();
                                                }}
                                                data-bs-dismiss='modal'
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                )}
                                {isCall && (
                                    <>
                                        <h5>
                                            ID : <span className='text-primary'>{modalMessage.id}</span>
                                        </h5>
                                        <h5>
                                            UserName : <span className='text-primary'>{modalMessage.username}</span>
                                        </h5>
                                        <h5>
                                            Chain Name : <span className='text-primary'>{modalMessage.chainName}</span>
                                        </h5>
                                        <h5>
                                            Room ID : <span className='text-primary'>{modalMessage.gameId}</span>
                                        </h5>
                                        <br />
                                        <h4>This Player wants to play with you!!!</h4>
                                    </>
                                )}
                            </Modal.Body>
                            <Modal.Footer>
                                {isCall && (
                                    <>
                                        <button
                                            type='button'
                                            className='btn btn-success'
                                            onClick={() => handleCall('accept')}
                                            data-bs-toggle='tooltip'
                                            data-bs-placement='top'
                                            title='Your Tooltip Text'
                                        >
                                            Accept
                                        </button>
                                        <button type='button' className='btn btn-secondary' onClick={() => handleCall('decline')}>
                                            Decline
                                        </button>
                                    </>
                                )}
                            </Modal.Footer>
                        </Modal>

                        <Modal show={gameModal} backdrop='static' keyboard={false} size='xl'>
                            <Modal.Header>
                                <Modal.Title>Tic Tac Toe</Modal.Title>
                            </Modal.Header>
                            <Modal.Body ref={divRef}>
                                {playerExited && <h3 className='text-center text-danger'>Player Exited the Game!!!</h3>}
                                <div className='game-board justify-content-center align-items-center d-flex'>
                                    <div className='me-3 fs-5 text-primary'>
                                        {/* <img src={info.network.image} /> */}
                                        {info.username}
                                    </div>
                                    {me === 'second' ? (
                                        <>
                                            <Board
                                                squares={squares}
                                                onClick={handleClick}
                                                currentPlayer={xIsNext ? 'X' : 'O'}
                                                opponent={defaultAsset.images}
                                                mine={playerProfile.assets}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <Board
                                                squares={squares}
                                                onClick={handleClick}
                                                currentPlayer={xIsNext ? 'X' : 'O'}
                                                mine={defaultAsset?.images}
                                                opponent={playerProfile?.assets}
                                            />
                                        </>
                                    )}

                                    <div className='ms-3 fs-5 text-primary'>
                                        {/* <img src={playerProfile.network.image} /> */}
                                        {playerProfile.username}
                                    </div>
                                </div>
                                <div className='game-info text-center mt-4'>
                                    <div>{status}</div>
                                </div>
                            </Modal.Body>
                            <Modal.Footer>
                                {/* <div>
                                    <button className='btn btn-success' onClick={takeScreenshot}>
                                        Take Screenshot
                                    </button>
                                </div> */}
                                <Button variant='secondary' onClick={exitGame}>
                                    Exit Game
                                </Button>
                            </Modal.Footer>
                        </Modal>
                        <Modal show={showModal} onHide={() => setShowModal(false)}>
                            <Modal.Header closeButton>
                                <Modal.Title>Publish Screenshot</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                                <img src={screenshot} alt='Screenshot' style={{ width: '100%' }} />
                                <p>Do you want to publish this screenshot?</p>
                            </Modal.Body>
                            <Modal.Footer>
                                <Button variant='secondary' onClick={() => setShowModal(false)}>
                                    Cancel
                                </Button>
                                <Button variant='primary' onClick={handlePublish}>
                                    Publish
                                </Button>
                            </Modal.Footer>
                        </Modal>
                        <AssetModal
                            show={assetModal}
                            close={() => setAssetModal(false)}
                            default={item => setDefaultAsset(item)}
                            gameId={info.gameId}
                        />
                    </div>
                </>
            ) : (
                <>
                    {hasPurchaed === 0 ? (
                        <>
                            <div className='row'>
                                <div className='col-12 d-flex justify-content-center align-items-center'>
                                    <div className='page-title-box text-center'>
                                        <p
                                            style={{
                                                fontSize: '25px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Unleash Your Inner Warrior in the <span className='text-primary'>Cross Chain</span> Digital Arena of
                                            Champions
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '23px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            <span className='text-primary'>Loading</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className='row'>
                                <div className='col-12 d-flex justify-content-center align-items-center'>
                                    <div className='page-title-box text-center'>
                                        <p
                                            style={{
                                                fontSize: '25px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Unleash Your Inner Warrior in the <span className='text-primary'>Cross Chain</span> Digital Arena of
                                            Champions
                                        </p>
                                        <p
                                            style={{
                                                fontSize: '23px',
                                                fontWeight: 'bold'
                                            }}
                                        >
                                            Welcome to <span className='text-primary'>Tic Tac Toe</span> Game with your{' '}
                                            <span className='text-primary'>Own NFTs</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <h1 className='text-center text-danger mt-5'>You have not purchased this game</h1>

                            <div className='d-flex justify-content-center align-item-center mt-3'>
                                <Button variant='danger' onClick={() => navigate('/')}>
                                    EXIT
                                </Button>
                            </div>
                        </>
                    )}
                </>
            )}
        </>
    );
}

export default Main;
