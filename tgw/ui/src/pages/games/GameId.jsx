import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import BlockchainService from '../../blockchain/service';
import ProviderService from '../../blockchain/providerService';
import GameContract from '../../blockchain/gameContract';
function GameId(props) {
    const [gameId, setGameId] = useState();
    const getGameId = async () => {
        const res = await GameContract.getGameId();
        setGameId(res);
    };

    const [copySuccess, setCopySuccess] = useState(false);
    const [copiedId, setCopiedId] = useState('');
    const copyToClipboard = id => {
        navigator.clipboard.writeText(id);
        setCopiedId(id);
        setCopySuccess(true);
        setTimeout(() => {
            setCopySuccess(false);
        }, 2000); // Clear copied message after 2 seconds
    };
    return (
        <div>
            <Modal show={props.show} size='lg'>
                <Modal.Header>
                    <Modal.Title>Game Id</Modal.Title>
                </Modal.Header>
                <Modal.Body className='text-center'>
                    <div>
                        <h4 className='text-center'>Your Game Id:</h4>
                    </div>
                    <div className='text-center text-primary'>
                        {gameId && (

                        <h5>
                            {gameId}{' '}
                            {!copySuccess ? (
                                <i
                                    className='bi bi-clipboard ms-1'
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => copyToClipboard(gameId)}
                                    title='Copy to Clipboard'
                                ></i>
                            ) : (
                                <>
                                    {copiedId === gameId ? (
                                        <i className='bi bi-clipboard-check ms-1'></i>
                                    ) : (
                                        <i
                                            className='bi bi-clipboard ms-1'
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => copyToClipboard(gameId)}
                                            title='Copy to Clipboard'
                                        ></i>
                                    )}
                                </>
                            )}
                        </h5>
                    
                        )}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='success' onClick={getGameId}>
                        Get Game Id
                    </Button>
                    <Button variant='primary' onClick={props.close}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default GameId;
