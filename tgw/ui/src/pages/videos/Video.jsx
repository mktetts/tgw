import React, { useEffect, useState } from 'react';
import { getVideos } from '../../helpers/helpers';
import { Container, Row, Col, Card } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Accordion from 'react-bootstrap/Accordion';

function Video() {
    const [allVideos, setAllVideos] = useState([]);
    const [runVideo, setRunVideo] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState(null);
    useEffect(() => {
        init();
    }, []);

    const init = async () => {
        const res = await getVideos();
        const videoData = [];

        for (const video of res) {
            const base64String = await Buffer.from(video.thumbnail.data).toString('base64');
            videoData.push({
                ...video,
                data: {
                    ...video.data,
                    thumbnail: base64String
                }
            });
        }
        setAllVideos(videoData);
    };
    const maxDescriptionLength = 40;
    const truncateDescription = (description, maxLength) => {
        if (description.length > maxLength) {
            return description.substring(0, maxLength) + '...';
        }
        return description;
    };
    const formatDate = isoString => {
        const date = new Date(isoString);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return date.toLocaleDateString(undefined, options);
    };
    return (
        <div>
            <Container>
                <h1 className='text-center mb-4'>Edge Videos</h1>
                <Row>
                    {allVideos.map((video, index) => (
                        <Col key={index} md={4}>
                            <Card
                                className='mb-4 card-hover'
                                onClick={() => {
                                    setSelectedVideo(video);
                                    setRunVideo(true);
                                    console.log(video);
                                }}
                            >
                                <Card.Img
                                    variant='top'
                                    src={`data:image/jpeg;base64,${video.data.thumbnail}`}
                                    style={{ height: '150px', cursor: 'pointer' }}
                                />
                                <Card.Body>
                                    <div className='d-flex align-items-center mb-2'>
                                        <img
                                            src={'/src/assets/images/theta.svg'}
                                            alt='Channel Logo'
                                            className='rounded-circle mr-2 me-1'
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <Card.Text>{truncateDescription(video.data.description, maxDescriptionLength)}</Card.Text>
                                    </div>
                                    <Card.Text className='ml-2' style={{ fontSize: '10px' }}>
                                        {formatDate(video.date)}
                                    </Card.Text>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </Container>

            <Modal show={runVideo && selectedVideo} backdrop='static' keyboard={false} size='xl'>
                <Modal.Header>
                    <Modal.Title>Video</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Col md={12}>
                        <div className='embed-responsive embed-responsive-16by9'>
                            <iframe
                                className='embed-responsive-item'
                                // src={props.uri}
                                src={'https://player.thetavideoapi.com/video/' + selectedVideo?.key}
                                allowFullScreen
                                title='Live Video'
                                style={{ width: '100%', height: 'auto', minHeight: '620px' }}
                            ></iframe>
                        </div>
                        <Accordion defaultActiveKey='0'>
                            <Accordion.Item eventKey='0'>
                                <Accordion.Header>Description</Accordion.Header>
                                <Accordion.Body>
                                <div className='d-flex align-items-center mb-2'>
                                        <img
                                            src={'/src/assets/images/theta.svg'}
                                            alt='Channel Logo'
                                            className='rounded-circle mr-2 me-1'
                                            style={{ width: '20px', height: '20px' }}
                                        />
                                        <Card.Text className='text-primary'>{selectedVideo?.data.owner} - Creator</Card.Text>
                                    </div>
                                    {selectedVideo?.data.description}
                                </Accordion.Body>
                            </Accordion.Item>
                        </Accordion>
                    </Col>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant='secondary' onClick={() => window.location.reload()}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}

export default Video;
