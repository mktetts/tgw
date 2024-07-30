import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import ProviderService from '../blockchain/providerService';
import { NETWORKS } from '../blockchain/networks';
import Dropdown from 'react-bootstrap/Dropdown';
import Toasts from './Toasts';

const Topbar = () => {
    const [isSidebarActive, setIsSidebarActive] = useState(true);
    const [windowHeight, setWindowHeight] = useState(window.innerHeight);

    const handleResize = () => {
        setWindowHeight(window.innerHeight);
    };

    useEffect(() => {
        init();
        window.addEventListener('resize', handleResize);
        handleResize(); // Set initial height

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleSidebar = () => {
        setIsSidebarActive(!isSidebarActive);
    };
    const [showToast, setShowToast] = useState(false);
    const [ToastMessage, setToastMessage] = useState('');
    const [signer, setSigner] = useState({});
    const [selectedNetwork, setSelectedNetwork] = useState('');
    const init = async () => {
        if (await ProviderService.enableEthereum()) {
            let signerr = await ProviderService.getSignerAccount();
            let formattedAddress = formatAddress(signerr.address);
            signerr = { ...signerr, ...{ formattedAddress: formattedAddress } };
            setSigner(signerr);
            setSelectedNetwork(NETWORKS[signerr.chainId]);
        }
    };
    function formatAddress(address) {
        const maxLength = 5;
        if (address.length <= maxLength * 2 + 3) {
            return address;
        }
        const start = address.substr(0, maxLength);
        const end = address.substr(-maxLength);
        return `${start}...${end}`;
    }

    const handleNetworkChange = async network => {
        try {
            await ProviderService.changeNetwork(network);
            setSelectedNetwork(network);
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
        <>
            <div className='navfixed'>
                <Navbar className='bg-body-tertiary' fixed='top' style={{ zIndex: '1000' }}>
                    <Container fluid>
                        <a className='navbar-brand me-lg-5'>
                            <img src='/src/assets/images/logo.png' alt='' className='logo-dark' height='40' width='90' />
                        </a>
                    </Container>
                    <div className='d-flex me-4'>
                        <Dropdown className='custom-dropdown'>
                            <Dropdown.Toggle variant='secondary'>
                                <img src={selectedNetwork.image} alt={selectedNetwork.chainName} className='network-image me-2' />
                                {selectedNetwork.chainName}
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                                {Object.entries(NETWORKS).map(([chainId, network]) => (
                                    <Dropdown.Item key={chainId} onClick={() => handleNetworkChange(network)} className='mt-2'>
                                        <img src={network.image} alt={network.chainName} className='network-image me-2' />
                                        {network.chainName}
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        </Dropdown>
                        <NavDropdown
                            style={{ paddingLeft: '10px' }}
                            title={
                                <div className='d-flex align-items-center'>
                                    <img
                                        src='/src/assets/images/user.jpg'
                                        alt='User'
                                        className='rounded-circle'
                                        style={{ width: '40px', height: '40px' }}
                                    />
                                    <div className='caption ms-3 '>
                                        <h6 className='mb-0 caption-title'>{signer.formattedAddress}</h6>
                                        <p className='mb-0 caption-sub-title'>
                                            {signer.balance} {signer.nativeCurrency}
                                        </p>
                                    </div>
                                </div>
                            }
                            id='navbarScrollingDropdown'
                            className='no-caret'
                        >
                            <h6 className='text-overflow m-3'>Welcome !</h6>
                            <NavDropdown.Item as={Link} to='/'>
                                <i className='mdi mdi-logout me-1'></i> <span>Logout</span>
                            </NavDropdown.Item>
                        </NavDropdown>
                    </div>
                </Navbar>
                <Navbar className='bg-body-tertiary' fixed='top' style={{ top: '6%', zIndex: '999' }}>
                    <Container style={{ width: '100%' }} className='justify-content-center'>
                        <Nav className='justify-content-center'>
                            <Nav.Link className=' ms-4 navlink' as={NavLink} to='/main/home'>
                                <h5>
                                    <span className='mdi mdi-view-dashboard-outline me-1'></span>Home
                                </h5>
                            </Nav.Link>
                            <Nav.Link className=' ms-4 navlink' as={NavLink} to='/main/games'>
                                <h5><span className="mdi mdi-gamepad-outline me-1"></span>
                                Games</h5>
                            </Nav.Link>
                            <Nav.Link className=' ms-4 navlink' as={NavLink} to='/main/myassets'>
                                <h5><span className="mdi mdi-treasure-chest-outline me-1"></span>
                                My Assets</h5>
                            </Nav.Link>
                            <Nav.Link className=' ms-4 navlink' as={NavLink} to='/main/lending'>
                                <h5><span className="mdi mdi-cash-refund me-1"></span>
                                NFT Renting</h5>
                            </Nav.Link>
                            <Nav.Link className=' ms-4 navlink' as={NavLink} to='/main/contribution'>
                                <h5><span className="mdi mdi-hand-coin-outline me-1"></span>
                                Contribution</h5>
                            </Nav.Link>
                            {/* <Nav.Link className=' ms-4 navlink' as={NavLink} to='/main/posts'>
                            <h5>Public Posts</h5>
                        </Nav.Link> */}
                            <Nav.Link className=' ms-4 navlink' as={NavLink} to='/main/explorer'>
                                <h5><span className="mdi mdi-compass me-1"></span>
                                Explorer</h5>
                            </Nav.Link>
                        </Nav>
                    </Container>
                </Navbar>
                <Toasts show={showToast} message={ToastMessage} close={() => setShowToast(false)} />
            </div>
        </>
    );
};

export default Topbar;
