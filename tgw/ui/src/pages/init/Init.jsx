import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NETWORKS } from '../../blockchain/networks';
import Stack from 'react-bootstrap/Stack';
import Button from 'react-bootstrap/Button';
import Toasts from '../../components/Toasts';

import ProviderService from '../../blockchain/providerService';

function Init() {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [ToastMessage, setToastMessage] = useState('');

    const handleAuthenticate = async () => {
        try {
            await ProviderService.enableEthereum();
            await ProviderService.authenticate();
            setShowToast(true);
            setToastMessage('Authentication Success');
            setTimeout(() => {
                setShowToast(false);
            }, 2000);
            setTimeout(() => {
                navigate('/main/home');
            }, 2500);
        } catch (e) {
            setShowToast(true);
            if (e.message.includes('user rejected action ')) {
                setToastMessage('User Rejected the action');
            } else {
                setToastMessage(e.message);
            }
        }
    };
    return (
        <div>
            <nav className='navbar navbar-expand-lg py-lg-1 navbar-dark'>
                <div className='container'>
                    <a className='navbar-brand me-lg-5'>
                        <img src='/src/assets/images/logo.svg' alt='' className='logo-dark' height='110' />
                    </a>
                    <Stack direction='horizontal' gap={3}>
                        <div>
                            <a className='text-white' target='_blank' href='/documentation/'>Developer Docs  <span className='mdi mdi-open-in-new'></span></a>
                        </div>
                        <div className='p-2'>
                            <Button variant='success' onClick={handleAuthenticate}>
                                {' '}
                                Connect Wallet{' '}
                            </Button>
                        </div>
                    </Stack>
                </div>
            </nav>

            <section className='hero-section'>
                <div className='container'>
                    <div className='row align-items-center'>
                        <div className='col-md-5'>
                            <div className='mt-md-4'>
                                <h2 className='text-white fw-normal mb-4 mt-3 hero-title'>Welcome to the Theta Multichain Game World</h2>

                                <p className='mb-4 font-16 text-white-50'>
                                    Discover limitless adventures and seamless gameplay across interconnected universes in the future of blockchain
                                    gaming
                                </p>

                                <Button variant='success' onClick={handleAuthenticate}>
                                    {' '}
                                    Enter the Game World{' '}
                                </Button>
                            </div>
                        </div>
                        <div className='col-md-5 offset-md-2'>
                            <div className='text-md-end mt-3 mt-md-0'>
                                <img src='/src/assets/images/front.png' alt='' className='img-fluid' />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div>
                <h3 className='text-center mt-5'> SUPPORTED BLOCKCHAINS</h3>
                <div className='carousel-sliding-container '>
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
                    </div>
                </div>
            </div>
           
            <div className='container'>
                <div className='row py-4'>
                    <div className='col-lg-12'>
                        <div className='text-center'>
                            <h1 className='mt-0'>
                                <i className='mdi mdi-gamepad'></i>
                            </h1>
                            <h3>
                                Seamless Gaming <span className='text-primary'>Across Blockchains</span> and Unite the Worlds{' '}
                            </h3>
                            <p className='text-muted mt-2'>
                                Unlock the full potential of your gaming prowess with a seamless, cross-chain ecosystem that connects diverse worlds
                            </p>
                        </div>
                    </div>
                </div>
                <h3 className='text-center mt-1'> FEATURES</h3>
                <div className='row'>
                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-gamepad-variant-outline fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Multi Chain Gaming</h4>
                            <p className='text-muted mt-2 mb-0'>Whatever be the blockchains, play from your blockchain</p>
                        </div>
                    </div>
                   
                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-gamepad-variant fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Create Game</h4>
                            <p className='text-muted mt-2 mb-0'>Create your game from any blockchain and publish</p>
                        </div>
                    </div>

                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-glasses fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Create NFT</h4>
                            <p className='text-muted mt-2 mb-0'>Mint your own creation for the games and publish it</p>
                        </div>
                    </div>
                </div>
                <div className='row'>
                <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-cart-check fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Buy NFTs and Games</h4>
                            <p className='text-muted mt-2 mb-0'>You can buy games and nfts from your own blockchain crypto</p>
                        </div>
                    </div>
                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-arrow-left-right-bold-outline fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Deploy in Edge Server</h4>
                            <p className='text-muted mt-2 mb-0'>You can deploy your game ui and server using edge storage server.</p>
                        </div>
                    </div>
                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-message-video fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Edge Videos</h4>
                            <p className='text-muted mt-2 mb-0'>You can upload the recorded stream to the Theta edge video and make available to users.</p>
                        </div>
                    </div>
                   
                </div>      
                <div className='row'>
                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-bitcoin fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Rent Your NFT</h4>
                            <p className='text-muted mt-2 mb-0'>Lend your NFT whenever you are off, and make earnings</p>
                        </div>
                    </div>
                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-arrow-left-right-bold-outline fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Teleporting</h4>
                            <p className='text-muted mt-2 mb-0'>We can teleport NFT from one blockchain to another blockchain.</p>
                        </div>
                    </div>
                    <div className='col-lg-4'>
                        <div className='text-center p-3'>
                            <div className='avatar-sm m-auto'>
                                <span className='avatar-title bg-primary-lighten rounded-circle'>
                                    <i className='mdi mdi-message-video fs-2'></i>
                                </span>
                            </div>
                            <h4 className='mt-3 text-primary'>Livestream</h4>
                            <p className='text-muted mt-2 mb-0'>You can make livestream while playing using Theta Video API</p>
                        </div>
                    </div>
                   
                </div>
            </div>
            <Toasts show={showToast} message={ToastMessage} close={() => setShowToast(false)} />
        </div>
    );
}

export default Init;
