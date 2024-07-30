import React, { useEffect, useState } from 'react';
import { NETWORKS } from '../blockchain/networks';
import Form from 'react-bootstrap/Form';
import { useNavigate } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Toast from 'react-bootstrap/Toast';
import { loginUser } from '../helpers/helpers';

function Init() {
    useEffect(() => {
        sessionStorage.clear();

    }, []);
    const navigate = useNavigate();
    const [openToast, setOpenToast] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [gameId, setGameId] = useState("")
    const [toastMessage, setToastMessage] = useState('');
    const handleEnter = async () => {
        // const res = await loginUser({
        //     username: username,
        //     password: password
        // });
        // console.log(res);
        // if (!res.status) {
        //     setToastMessage(res.message);
        //     setOpenToast(true);
        //     setTimeout(() => {
        //         setOpenToast(false);
        //     }, 2000);
        //     return;
        // }
        // setToastMessage(res.message);
        // setOpenToast(true);
        sessionStorage.setItem(
            'myinfo',
            JSON.stringify({
                username: username,
                gameId: import.meta.env.VITE_APP_GAME_ID
            })
        );
        setTimeout(() => {
            setOpenToast(false);
            navigate('/main');
        }, 2000);
    };
    return (
        <div>
            <div
                className='container-fluid'
                style={{
                    paddingLeft: '90px',
                    paddingRight: '80px',
                    paddingBottom: '300px',
                    marginTop: '5%'
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
                                Unleash Your Inner Warrior in the <span className='text-primary'>Cross Chain</span> Digital Arena of Champions
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

                <div
                    style={{
                        marginLeft: 'auto',
                        marginRight: 'auto',
                        maxWidth: '300px'
                    }}
                >
                    <h4 className='text-center mb-4 mt-4' style={{ fontWeight: 'bold' }}>
                        Username Details
                    </h4>
                    <Form.Group className='mb-3' controlId='exampleForm.ControlInput1'>
                        <Form.Label>Username or Address</Form.Label>
                        <Form.Control type='email' value={username} onChange={e => setUsername(e.target.value)} />
                    </Form.Group>
                    {/* <Form.Label htmlFor='inputPassword5'>Password</Form.Label>
                    <Form.Control
                        type='password'
                        id='inputPassword5'
                        aria-describedby='passwordHelpBlock'
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                    <br />
                    <Form.Group className='mb-3' controlId='exampleForm.ControlInput2'>
                        <Form.Label>Game Id</Form.Label>
                        <Form.Control type='email' value={gameId} onChange={e => setGameId(e.target.value)} />
                    </Form.Group>
                    <Form.Text id='passwordHelpBlock' muted>
                        *If the user not registered before, new user will be registered.
                    </Form.Text> */}
                    <div className=' mt-3 text-center'>
                        <Button variant='primary' onClick={handleEnter}>
                            {' '}
                            Enter the Arena{' '}
                        </Button>{' '}
                    </div>
                    
                    {openToast && (
                        <div style={{ height: '100vh' }}>
                            <Toast className='position-absolute top-0 end-0 m-3 bg-warning'>
                                <Toast.Header>
                                    <img src='holder.js/20x20?text=%20' className='rounded me-2' alt='' />
                                    <strong className='me-auto'>Login / Register</strong>
                                </Toast.Header>
                                <Toast.Body>{toastMessage}</Toast.Body>
                            </Toast>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Init;
