import React, { useEffect, useState, useContext } from 'react';
import { Button, Col, Dropdown, Form, Accordion, Card } from 'react-bootstrap';
import Tab from 'react-bootstrap/Tab';
import Tabs from 'react-bootstrap/Tabs';
import JSZip from 'jszip';
import Toasts from '../../components/Toasts';
import { deleteMyInstace, getAllInstance, getMyInstance, uploadDeploymentDetails } from '../../helpers/helpers';
import ProviderService from '../../blockchain/providerService';
import TransactionModal from '../../components/TransactionModal';
import { socketContext } from '../../socket/SocketConnection';
import { FaCopy } from 'react-icons/fa';
import clipboardCopy from 'clipboard-copy';
import BlockchainService from '../../blockchain/service';

function Deploy() {
    const { TGWServer } = useContext(socketContext);
    const [selectedOption, setSelectedValue] = useState('Select an option');
    const [file, setFile] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [ToastMessage, setToastMessage] = useState('');
    const [accountData, setAccountData] = useState({});
    const [appName, setAppName] = useState('');
    const [allInstance, setAllInstance] = useState([]);
    const [overAllInstance, setOverAllInstance] = useState([]);
    const [activeKey, setActiveKey] = useState(null);
    const [reload, setReload] = useState(false);
    const handleToggle = rowIndex => {
        setActiveKey(activeKey === rowIndex ? null : rowIndex);
    };
    const initialTransactionModalState = {
        showModal: false,
        showSpinner: false,
        transactionHash: '',
        explorer: '',
        modalMessage: ''
    };

    const [transactionModal, setTransactionModal] = useState(initialTransactionModalState);
    useEffect(() => {
        init();
    }, [reload]);
    if (TGWServer) {
        TGWServer.on('status', data => {
            console.log(data);
        });
        TGWServer.on('docker-delete', data => {
            setShowToast(true);
            setToastMessage(data.message);
        });
    }
    const init = async () => {
        try {
            await BlockchainService.enableEthereum()
            await ProviderService.enableEthereum();
            const signer = await ProviderService.getSignerAccount();
            setAccountData(signer);
            const instances = await getMyInstance(signer.address);
            setAllInstance(instances);
            const overAll = await getAllInstance();
            setOverAllInstance(overAll);
        } catch (e) {
            setShowToast(true);
            if (e.message.includes('user rejected action ')) {
                setToastMessage('User Rejected the action');
            } else {
                setToastMessage(e.message);
            }
        }
    };
    function formatAddress(address, length) {
        const maxLength = length;
        if (address.length <= maxLength * 2 + 3) {
            return address;
        }
        const start = address.substr(0, maxLength);
        const end = address.substr(-maxLength);
        return `${start}...${end}`;
    }
    const handleSelect = (eventKey, event) => {
        setSelectedValue(eventKey);
    };
    const handleFolderUpload = async event => {
        const files = event.target.files[0];
        // Process the files here
        setFile(files);
    };

    const handleSubmit = async e => {
        e.preventDefault();
        if (!file) {
            setShowToast(true);
            setToastMessage('Please upload a file.');
            return;
        }

        const zip = new JSZip();
        try {
            const loadedZip = await zip.loadAsync(file);
            let hasNodeModules = false;
            let hasDockerfile = false;

            const checkFile = async (relativePath, file) => {
                if (file.dir && relativePath.includes('node_modules')) {
                    hasNodeModules = true;
                }
                if (!file.dir && relativePath.includes('Dockerfile')) {
                    hasDockerfile = true;
                }
            };

            await Promise.all(
                Object.keys(loadedZip.files).map(relativePath => {
                    const file = loadedZip.files[relativePath];
                    return checkFile(relativePath, file);
                })
            );

            if (hasNodeModules) {
                setShowToast(true);
                setToastMessage('Please remove node_modules folder.');
                return;
            } else if (!hasDockerfile) {
                setShowToast(true);
                setAlertMessage('Please attach a Dockerfile.');
                return;
            }
            setTransactionModal(prev => ({
                ...prev,
                showModal: true,
                showSpinner: true,
                modalMessage: 'Uploading file to edge storage...'
            }));
            const res = await uploadDeploymentDetails(file, file.name, {
                appName: appName,
                type: selectedOption,
                owner: accountData.address
            });
            if (res.status) {
                setTransactionModal(prev => ({
                    ...prev,
                    showModal: true,
                    showSpinner: false,
                    modalMessage: 'Uploaded Successfully, Please see My Running instance tab to start your instance'
                }));
            }
        } catch (error) {
            setTransactionModal(initialTransactionModalState);
            setShowToast(true);
            setToastMessage('An error occurred while processing the file.');
        }
    };

    const deleteMyInstance = async item => {
        try {
            TGWServer.emit('delete-docker', item);
            setReload(!reload);
        } catch (e) {
            console.log(e);
        }
    };

    const startInstace = async item => {
        TGWServer.emit('run-docker', item);
    };
    const [validName, setValidName] = useState(true);
    const checkValidAppName = async name => {
        for (let i = 0; i < overAllInstance.length; i++) {
            if (overAllInstance[i].data.appName === name) {
                setValidName(false);
                break;
            }
            if (i === overAllInstance.length - 1) {
                setValidName(true);
            }
        }
    };

    const copyToClipboard = text => {
        clipboardCopy(text);
    };
    return (
        <div>
            <div>
                <h3 className='text-center'>
                    Welcome to the<span className='text-primary'> Theta Edge Storage Cloud</span> Server
                </h3>
                <h5 className='text-center mt-3'> Deploy Your Application at free of cost and make a magic in blockchain gaming</h5>
            </div>
            <div className='mt-5'>
                <Tabs className='mb-3' variant='pills' fill>
                    <Tab eventKey='home' title='Deploy New Instance'>
                        <h4>Deploy New Instance:-</h4>
                        <Col md={6} className='mt-5'>
                            <Form.Group controlId='inputField1'>
                                <Form.Label>Enter your Application Name</Form.Label>
                                <Form.Control
                                    type='text'
                                    value={appName}
                                    onChange={e => {
                                        setAppName(e.target.value);
                                        checkValidAppName(e.target.value);
                                    }}
                                />
                                {appName && (
                                    <>
                                        {validName ? (
                                            <>
                                                <p className='text-success mt-1'>
                                                    <span className='mdi mdi-check'></span>
                                                    App Name Available
                                                </p>
                                            </>
                                        ) : (
                                            <>
                                                <p className='text-danger mt-1'>
                                                    <span className='mdi mdi-alert-circle-outline'></span>
                                                    App Name not Available
                                                </p>
                                            </>
                                        )}
                                    </>
                                )}
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Label className='mt-4'>Enter your Application Type</Form.Label>
                            <Dropdown className='w-100' style={{ width: '400px' }} onSelect={handleSelect}>
                                <Dropdown.Toggle variant='secondary' style={{ width: '100%' }}>
                                    {selectedOption}
                                </Dropdown.Toggle>
                                <Dropdown.Menu style={{ width: '100%' }}>
                                    <Dropdown.Item eventKey='Frontend'>Frontend</Dropdown.Item>
                                    <Dropdown.Item eventKey='Backend'>Backend</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>
                        </Col>
                        <Col md={6} className='mt-4'>
                            <Form.Group controlId='formFolderUpload' className='mb-3'>
                                <Form.Label>
                                    Upload file (must be a .zip file{' '}
                                    <a href='/documentation/doc2' target='_blank'>
                                        see here.
                                    </a>
                                    )
                                </Form.Label>
                                <Form.Control type='file' onChange={handleFolderUpload} />
                            </Form.Group>
                        </Col>
                        <div className='d-flex justify-content-center mt-5 '>
                            <Button variant='success' onClick={handleSubmit}>
                                Deploy Your Instance
                            </Button>
                        </div>
                    </Tab>
                    <Tab eventKey='profile' title='My Running Instance'>
                        <h4>My Instances:-</h4>
                        <Accordion activeKey={activeKey}>
                            <table className='table table-hover table-centered mt-4 table-custom'>
                                <thead>
                                    <tr style={{ textAlign: 'center' }}>
                                        <th>S.No</th>
                                        <th>Owner</th>
                                        <th>Edge Key</th>
                                        <th>App Name</th>
                                        <th>App Type</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                        <th>Error</th>

                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allInstance.map((item, index) => (
                                        <React.Fragment key={index}>
                                            <tr key={index} style={{ textAlign: 'center' }}>
                                                <td>{index + 1}</td>
                                                <td>{formatAddress(item.owner, 6)}</td>
                                                <td>{formatAddress(item.key, 8)}</td>
                                                <td>{item.data.appName}</td>
                                                <td>{item.data.type}</td>
                                                <td>
                                                    {item.status === 'Running' ? (
                                                        <>
                                                            <span
                                                                className='mdi mdi-check-all'
                                                                style={{ background: '#84de81', padding: '5px 5px 5px 5px' }}
                                                            >
                                                                Running
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <>{item.status}</>
                                                    )}
                                                </td>
                                                <td>
                                                    <Button
                                                        size='sm'
                                                        variant='success'
                                                        style={{ marginTop: '-5px' }}
                                                        disabled={item.status !== 'Not Running'}
                                                        onClick={() => startInstace(item)}
                                                    >
                                                        Start
                                                    </Button>
                                                </td>
                                                <td>
                                                    {item.error ? (
                                                        <>
                                                            <span
                                                                className='mdi mdi-alert-circle'
                                                                style={{ background: '#d96262', padding: '5px 5px 5px 5px' }}
                                                            >
                                                                Error{' '}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        'None'
                                                    )}
                                                </td>

                                                <td>
                                                    <Button
                                                        variant='link'
                                                        onClick={() => handleToggle(index.toString())}
                                                        style={{ marginTop: '-5px' }}
                                                    >
                                                        {activeKey === index.toString() ? 'Hide' : 'Expand'}
                                                    </Button>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td colSpan='10' className='p-0'>
                                                    <Accordion.Collapse eventKey={index.toString()}>
                                                        <Card.Body>
                                                            <div style={{ padding: '20px 20px 20px 20px' }}>
                                                                <h4 className='mb-3'>Details:</h4>
                                                                {item.error ? (
                                                                    <>{item.error}</>
                                                                ) : (
                                                                    <>
                                                                        <h5>
                                                                            File Name: <span className='text-primary'>{item.fileName}</span>{' '}
                                                                        </h5>
                                                                        <h5>
                                                                            Image Name: <span className='text-primary'>{item.dockerImageName}</span>{' '}
                                                                        </h5>
                                                                        <h5>
                                                                            Container Name:{' '}
                                                                            <span className='text-primary'>{item.dockerContainerName}</span>{' '}
                                                                        </h5>
                                                                        <h5>
                                                                            URL:{' '}
                                                                            <span className='text-primary'>
                                                                                <a href={item.url} target='_blank'>
                                                                                    {item.url} <span className='mdi mdi-open-in-new me-2'></span>
                                                                                </a>{' '}
                                                                                <Button
                                                                                    variant='outline-secondary '
                                                                                    onClick={() => copyToClipboard(item.url)}
                                                                                >
                                                                                    <FaCopy />
                                                                                </Button>
                                                                            </span>{' '}
                                                                        </h5>
                                                                    </>
                                                                )}
                                                                <div className='float-end mb-3 mt-4'>
                                                                    <Button variant='danger' onClick={() => deleteMyInstance(item)}>
                                                                        Delete Application
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </Card.Body>
                                                    </Accordion.Collapse>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </Accordion>
                    </Tab>
                </Tabs>
                <Toasts show={showToast} message={ToastMessage} close={() => setShowToast(false)} />
                <TransactionModal
                    data={transactionModal}
                    close={() => {
                        setTransactionModal(initialTransactionModalState);
                        setReload(!reload);
                    }}
                />
            </div>
        </div>
    );
}

export default Deploy;
