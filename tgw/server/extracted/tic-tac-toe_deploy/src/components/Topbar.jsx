import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Container from 'react-bootstrap/Container';
import Form from 'react-bootstrap/Form';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import { Link } from 'react-router-dom';
import { NETWORKS } from '../blockchain/networks';
import BlockchainService from '../blockchain/service';
// import { changeNetwork, getCurrentChain } from '../assets/rpc-client.min';
function Topbar() {
    const [myInfo, setMyInfo] = useState({});
    const [selectedNetwork, setSelectedNetwork] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    useEffect(() => {
        let myinfo = JSON.parse(sessionStorage.getItem('myinfo'));
        setMyInfo(myinfo);
        init();
    }, []);

    const init = async () => {
        await BlockchainService.enableEthereum()
        let chain = await BlockchainService.getCurrentNetwork();
        setSelectedNetwork(NETWORKS[chain.chainId]);
    };

    const handleNetworkChange = async network => {
        try {
            await BlockchainService.changeNetwork(network);
            setIsOpen(false);
            setSelectedNetwork(network);
        } catch (e) {
            console.log(e)
        }
    };
    return (
        <div>
            <Navbar expand='lg' className='bg-body-tertiary'>
                <Container fluid>
                    <Navbar.Brand ><img src='/src/assets/images/ttt.jpg' width={50} height={40} /></Navbar.Brand>
                    <Navbar.Toggle aria-controls='navbarScroll' />
                    <Navbar.Collapse id='navbarScroll'>
                        <Nav className='me-auto my-2 my-lg-0' style={{ maxHeight: '100px' }} navbarScroll></Nav>
                            <div className='network-select me-4' style={{width:'250px'}} >
                                <p className='mb-1' style={{ fontWeight: 'bold' }}></p>
                                <div className='custom-select mt-1' onClick={() => setIsOpen(!isOpen)}>
                                    <div className='custom-select__selected'>
                                        {selectedNetwork ? (
                                            <>
                                                <img src={selectedNetwork.image} alt={selectedNetwork.chainName} className='network-image' />
                                                {selectedNetwork.chainName}

                                                {/* <span className='float-end'>&#8659;</span> */}
                                            </>
                                        ) : (
                                            <>
                                                <img src='/assets/images/chainlink.png' className='network-image' />
                                                {'Select Network'}
                                            </>
                                        )}
                                    </div>
                                    {isOpen && (
                                        <div className='custom-select__options'>
                                            {Object.entries(NETWORKS).map(([chainId, network]) => (
                                                <div key={chainId} className='custom-select__option' onClick={() => handleNetworkChange(network)}>
                                                    <img src={network.image} alt={network.chainName} className='network-image' />
                                                    {network.chainName}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        <div className='d-flex me-4'>
                            <NavDropdown
                                title={
                                    <div className='d-flex align-items-center'>
                                        <img
                                            src='src/assets/images/user.jpg'
                                            alt='User'
                                            className='rounded-circle'
                                            style={{ width: '30px', height: '30px', marginRight: '10px' }}
                                        />

                                        <span>{myInfo.username}</span>
                                    </div>
                                }
                                id='navbarScrollingDropdown'
                                className='no-caret'
                            >
                                {/* <NavDropdown.Item href='#action3'>Action</NavDropdown.Item>
                                <NavDropdown.Item href='#action4'>Another action</NavDropdown.Item>
                                <NavDropdown.Divider /> */}
                                <NavDropdown.Item as={Link} to='/'>
                                    Logout
                                </NavDropdown.Item>
                            </NavDropdown>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>
        </div>
    );
}

export default Topbar;
