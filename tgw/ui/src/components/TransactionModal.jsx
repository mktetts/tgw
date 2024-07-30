import React, { useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';

function TransactionModal(props) {
    return (
        <Modal show={props.data.showModal} backdrop='static' keyboard={false} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Transaction</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div className='d-flex justify-content-center align-items-center'>
                    {props.data.showSpinner && <Spinner animation='border' size='sm' className='mb-2' />}
                    <h5 className='ms-2'>
                        {props.data.transactionHash && <img src='/src/assets/images/thumbsup.svg' height={30} width={40} className='mb-2' />}
                        {props.data.modalMessage}
                    </h5>
                </div>
                <div>
                    {props.data.transactionHash && (
                        <>
                            <a
                                style={{ cursor: 'pointer', textDecoration: 'none' }}
                                onMouseOver={e => (e.target.style.textDecoration = 'underline')}
                                onMouseOut={e => (e.target.style.textDecoration = 'none')}
                                href={props.data.explorer + props.data.transactionHash}
                                target='_blank'
                                className='text-center'
                            >
                                <h6 className='text-primary mt-2'>
                                    {props.data.transactionHash} <span className='mdi mdi-open-in-new'></span>
                                </h6>
                            </a>
                        </>
                    )}
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='secondary' onClick={props.close}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default TransactionModal;
