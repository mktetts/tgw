import React from 'react';
import Toast from 'react-bootstrap/Toast';
import ToastContainer from 'react-bootstrap/ToastContainer';

function Toasts(props) {
    return (
        <>
            <div>
                <ToastContainer
                    className='p-3'
                    position='top-center'
                    style={{ zIndex: 1000, position: 'fixed', top: '0', left: '50%', transform: 'translateX(-50%)' }}
                >
                    <Toast show={props.show} onClose={props.close} bg='secondary'>
                        <Toast.Header closeButton={true}>
                            <strong className='me-auto'>Message</strong>
                        </Toast.Header>
                        <Toast.Body className='text-white'>{props.message}</Toast.Body>
                    </Toast>
                </ToastContainer>
            </div>
        </>
    );
}

export default Toasts;
