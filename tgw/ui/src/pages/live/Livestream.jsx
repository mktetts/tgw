import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Form, InputGroup } from 'react-bootstrap';
import io from 'socket.io-client';
import BlockchainService from '../../blockchain/service';
import Modal from 'react-bootstrap/Modal';
const Livestream = props => {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const uri = searchParams.get('data');
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [socketServer, setSocketServer] = useState();
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [accountData, setAccountData] = useState({});
    const [allUsers, setAllUsers] = useState([]);
    const [donation, setDonation] = useState(0);
    const [reactions, setReactions] = useState({
        thumbsUp: 0,
        thumbsDown: 0,
        love: 0,
        laugh: 0,
        surprised: 0
    });

    useEffect(() => {
        init();
        console.log(props.uri);
        setComments(prevComments => [...prevComments, props.newComment]);
        
    }, [props.newComment]);

    const [myBalance, setMyBalance] = useState('');
    const init = async () => {
        if (await BlockchainService.enableEthereum()) {
            const signer = await BlockchainService.getSignerAccount();
            setAccountData(signer);
            const currentNetwork = await BlockchainService.getCurrentNetwork();
            setSelectedNetwork(currentNetwork);
            setMyBalance(await BlockchainService.getMyBalance());
        }
    };

    const handleCommentChange = e => {
        setNewComment(e.target.value);
    };

    const handleCommentSubmit = e => {
        e.preventDefault();
        if (newComment.trim()) {
            props.sendComment(newComment);
            // socketServer.emit('newComment', newComment);
            setNewComment('');
        }
    };

    const handleReactionClick = reaction => {
        setReactions({
            ...reactions,
            [reaction]: reactions[reaction] + 1
        });
    };

    const [message, setMessage] = useState('');
    const handleDonation = async () => {
        try {
            const res = await BlockchainService.donate(props.streamer.address, donation);
            console.log(res);
            setMessage(res.message);
        } catch (e) {}
    };

   
    return (
        <div>
            <Modal show={props.show} size='xl'>
                <Modal.Header>
                    <Modal.Title>Live Video</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Container>
                        <Row>
                            <Col md={8}>
                                <div className='embed-responsive embed-responsive-16by9'>
                                    <iframe
                                        className='embed-responsive-item'
                                        // src={props.uri}
                                        src={'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'}
                                        allowFullScreen
                                        title='Live Video'
                                        style={{ height: '500px', width: '700px' }}
                                    ></iframe>
                                </div>
                            </Col>
                            <Col md={4}>
                                <h5>Comments</h5>
                                <Form onSubmit={handleCommentSubmit}>
                                    <Form.Group controlId='commentForm'>
                                        <Form.Control type='text' placeholder='Add a comment' value={newComment} onChange={handleCommentChange} />
                                    </Form.Group>
                                    <Button variant='primary' type='submit' className='mt-3'>
                                        Comment
                                    </Button>
                                </Form>
                                <ul className='list-unstyled mt-3 scrollable-comments'>
                                    {comments.map((comment, index) => (
                                        <li key={index} className='border-bottom pb-2 mb-2'>
                                            <div style={{ fontSize: '8px' }}>{comment.sender}</div>
                                            <div style={{ fontSize: '18px' }}>{comment.data}</div>
                                        </li>
                                    ))}
                                </ul>
                            </Col>
                        </Row>
                        {/* <Row className='mt-3'>
                    <Col>
                        <h5>Reactions</h5>
                        <Button variant='outline-primary' onClick={() => handleReactionClick('thumbsUp')}>
                            👍 {reactions.thumbsUp}
                        </Button>{' '}
                        <Button variant='outline-primary' onClick={() => handleReactionClick('thumbsDown')}>
                            👎 {reactions.thumbsDown}
                        </Button>{' '}
                        <Button variant='outline-primary' onClick={() => handleReactionClick('love')}>
                            ❤️ {reactions.love}
                        </Button>{' '}
                        <Button variant='outline-primary' onClick={() => handleReactionClick('laugh')}>
                            😂 {reactions.laugh}
                        </Button>{' '}
                        <Button variant='outline-primary' onClick={() => handleReactionClick('surprised')}>
                            😮 {reactions.surprised}
                        </Button>
                    </Col>
                </Row> */}
                        <div className='text-center mt-5'>
                            <h5>
                                Streamer: <span className='text-success'>{props.streamer.address}</span>
                            </h5>
                        </div>
                        <div className='d-flex justify-content-center align-items-center mt-1'>
                            <Row className='justify-content-md-center'>
                                <Col md={9}>
                                    <InputGroup className='mb-2' size='sm'>
                                        <InputGroup.Text>Enter Value</InputGroup.Text>
                                        <Form.Control value={donation} onChange={e => setDonation(e.target.value)} />
                                        <Button variant='success' onClick={handleDonation}>
                                            Donate {selectedNetwork.nativeCurrency}
                                        </Button>
                                    </InputGroup>
                                </Col>
                            </Row>
                        </div>
                        <p className='text-center'>
                            Your Balance: {myBalance} {selectedNetwork.nativeCurrency}
                        </p>
                        <h6 className='text-center text-success'>{message}</h6>
                        
                    </Container>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={props.close}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default Livestream;
