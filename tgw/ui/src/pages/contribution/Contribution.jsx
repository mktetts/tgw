import React, { useEffect, useState } from 'react';
import { NETWORKS } from '../../blockchain/networks';
import BlockchainService from '../../blockchain/service';
import { InputGroup, Form, Button, Container, Row, Col } from 'react-bootstrap';
import Toasts from '../../components/Toasts';
import Chart from 'react-apexcharts';
import Card from 'react-bootstrap/Card';
import ProviderService from '../../blockchain/providerService';
import ContributionContract from '../../blockchain/contributionContract';
import FeesCollectorContract from '../../blockchain/feesCollectorContract';
import TransactionModal from '../../components/TransactionModal';

function Contribution() {
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [overAllContribution, setOverAllContribution] = useState(0);
    const [myContribution, setMyContribution] = useState(0);
    const [showToast, setShowToast] = useState(false);
    const [ToastMessage, setToastMessage] = useState('');
    const [allContributions, setAllContributions] = useState([]);
    const [allCoupens, setAllCoupens] = useState([]);
    const [eoaBalance, setEoaBalance] = useState(0);
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
    }, []);

    const init = async () => {
        try {
            await BlockchainService.enableEthereum()
            await ProviderService.enableEthereum();
            const network = await ProviderService.getCurrentNetwork();
            setSelectedNetwork(network);
            const eoaBalance = await FeesCollectorContract.getEOABalance(network.chainId, network.rpcUrls);
            setEoaBalance(eoaBalance);
            let contribution = await ContributionContract.getOverAllContrubutions();
            setOverAllContribution(contribution);
            contribution = await ContributionContract.getAllContributions();
            setAllContributions(contribution);
            contribution = await ContributionContract.getMyContrubutions();
            setMyContribution(contribution);
            setAllCoupens(await ContributionContract.getMyCoupons());
           
        } catch (e) {
            setShowToast(true);
            if (e.message.includes('user rejected action ')) {
                setToastMessage('User Rejected the action');
            } else {
                setToastMessage(e.message);
            }
        }
    };

    const chartData = {
        options: {
            chart: {
                id: 'wave-chart',
                toolbar: {
                    show: false
                }
            },
            xaxis: {
                type: 'datetime',
                labels: {
                    formatter: function (value) {
                        return new Date(value).toLocaleDateString();
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Amount'
                }
            },
            tooltip: {
                x: {
                    formatter: function (value) {
                        return new Date(value).toLocaleDateString();
                    }
                }
            }
        },
        series: [
            {
                name: 'Contributions ' + '(' + selectedNetwork.nativeCurrency + ')',
                data: allContributions.map(entry => ({
                    x: entry.timestamp,
                    y: entry.value,
                    contributor: entry.contributor
                }))
            }
        ]
    };
    const [contributingPrice, setContributingPrice] = useState(0);
    const handleAddContribution = async () => {
        try {
            if (contributingPrice === 0) {
                setShowToast(true);
                setToastMessage('Amount should be greater than Zero');
                return;
            }
            setTransactionModal(prev => ({
                ...prev,
                showModal: true,
                showSpinner: true,
                modalMessage: 'Contribution Initiated...'
            }));
            const res = await ContributionContract.addContribution(contributingPrice.toString());
            if (res.hash) {
                setTransactionModal(prev => ({
                    ...prev,
                    showSpinner: false,
                    modalMessage: 'Contributed Successfully...',
                    transactionHash: res.hash,
                    explorer: selectedNetwork.explorer
                }));
            } else {
            }
        } catch (e) {
            setTransactionModal(initialTransactionModalState);
            setShowToast(true);
            if (e.message.includes('user rejected action ')) {
                setToastMessage('User Rejected the action');
            } else {
                setToastMessage(e.message);
            }
        }
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

    const withDraw = async item => {
        try {
            const coupen = await ContributionContract.getCoupenValue(item.id);
            if (!coupen.valid) {
                setShowToast(true);
                setToastMessage('Coupen Invalid');
                return;
            }
            setTransactionModal(prev => ({
                ...prev,
                showModal: true,
                showSpinner: true,
                modalMessage: 'Withdraw Initiated...'
            }));
            let res = await ContributionContract.withdrawCouponValue(item.id);
            if (res.hash) {
                setTransactionModal(prev => ({
                    ...prev,
                    showSpinner: false,
                    modalMessage: 'Withdraw Successfully...',
                    transactionHash: res.hash,
                    explorer: selectedNetwork.explorer
                }));
            }
        } catch (e) {
            setTransactionModal(initialTransactionModalState);
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
            <h3 className='text-center'>Welcome to the Relayers Contribution Platform</h3>
            <h5 className='text-center mt-3'> Contribute your crypto coins to facilitate seamless cross-chain communication and receive rewards</h5>
            <div className='carousel-sliding-container mt-3'>
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
                </div>
            </div>

            <h4 className='text-center mt-3'>
                Available {selectedNetwork.nativeCurrency} for Cross Chain Funtions -{' '}
                <span className='text-primary'>
                    {eoaBalance} {selectedNetwork.nativeCurrency}
                </span>
            </h4>
            <Row className='mt-3'>
                <Col md={7}>
                    <div className='card' style={{ backgroundColor: '#f8f9fa', border: '0px solid #ced4da' }}>
                        <div className='card-body'>
                            <h5 className='card-title'>
                                Contribution of -{' '}
                                <span className='text-primary'>
                                    {overAllContribution} {selectedNetwork.nativeCurrency}
                                </span>{' '}
                                by <span className='text-primary'>{allContributions.length}</span> Contributers
                            </h5>
                            <Chart options={chartData.options} series={chartData.series} type='line' width='100%' height={400} />
                        </div>
                    </div>
                </Col>
                <Col>
                    <h5 className='text-center me-4 mt-5'>
                        {' '}
                        Total Contributed Amount:{' '}
                        <span className=' text-success' style={{ cursor: 'pointer' }}>
                            {overAllContribution} {selectedNetwork.nativeCurrency}
                        </span>
                    </h5>
                    <div className='d-flex justify-content-center align-items-center mt-5'>
                        <img src={selectedNetwork.image} height={150} />
                    </div>
                    <div className='d-flex justify-content-center align-items-center mt-5'>
                        <Row className='justify-content-md-center'>
                            <Col md={9}>
                                <InputGroup className='mb-2' size='sm'>
                                    <InputGroup.Text>Enter Value</InputGroup.Text>
                                    <Form.Control value={contributingPrice} onChange={e => setContributingPrice(e.target.value)} />
                                    <Button variant='success' onClick={handleAddContribution}>
                                        Contribute {selectedNetwork.nativeCurrency}
                                    </Button>
                                </InputGroup>
                            </Col>
                        </Row>
                    </div>
                    <h6 className='text-center me-4 mt-4'>
                        {' '}
                        Your Contributed Amount till now:{' '}
                        <span className='text-success' style={{ cursor: 'pointer' }}>
                            {myContribution} {selectedNetwork.nativeCurrency}
                        </span>
                    </h6>
                </Col>
            </Row>

            <div className='text-center mt-5'>
                <h2> Your Coupens</h2>
            </div>

            {/* <Row className="justify-content-md-center mt-1">
                <Col md={12}>
                    <div className="d-flex flex-wrap ">
                        <Card style={{width:'200px'}}>
                            <Card.Img
                                variant="top"
                                src="/src/assets/images/coupon.png"
                            />
                            <Card.Body>
                                <Card.Text>
                                    Some quick example text to build on the card
                                    title and make up the bulk of the card's
                                    content.
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    </div>
                </Col>
            </Row> */}
            <table className='table table-hover table-centered mt-4 table-custom'>
                <thead>
                    <tr style={{ textAlign: 'center' }}>
                        <th>S.No</th>
                        <th>Coupon Code</th>
                        <th>Coupen Value</th>
                        <th>Status</th>
                        <th>Validity</th>
                        <th>Withdraw</th>
                    </tr>
                </thead>
                <tbody>
                    {allCoupens.map((item, index) => (
                        <tr key={index} style={{ textAlign: 'center' }}>
                            <td>{index + 1}</td>
                            <td>
                                {item.code}{' '}
                                {!copySuccess ? (
                                    <i
                                        className='bi bi-clipboard ms-1'
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => copyToClipboard(item.id)}
                                        title='Copy to Clipboard'
                                    ></i>
                                ) : (
                                    <>
                                        {copiedId === item.id ? (
                                            <i className='bi bi-clipboard-check ms-1'></i>
                                        ) : (
                                            <i
                                                className='bi bi-clipboard ms-1'
                                                style={{ cursor: 'pointer' }}
                                                onClick={() => copyToClipboard(item.id)}
                                                title='Copy to Clipboard'
                                            ></i>
                                        )}
                                    </>
                                )}
                            </td>
                            <td>
                                {item.value} {selectedNetwork.nativeCurrency}
                            </td>
                            <td style={{ fontSize: '16px' }}>
                                {item.withdrawn ? (
                                    <span className='badge bg-danger mb-1'>Used</span>
                                ) : (
                                    <span className='badge bg-success'>Not Used</span>
                                )}
                            </td>
                            <td>{item.timestamp}</td>
                            <td>
                                <Button size='sm' variant='success' onClick={() => withDraw(item)} disabled={item.withdrawn}>
                                    Withdraw
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <Toasts show={showToast} message={ToastMessage} close={() => setShowToast(false)} />
            <TransactionModal
                data={transactionModal}
                close={() => {
                    setTransactionModal(initialTransactionModalState);
                }}
            />
        </div>
    );
}

export default Contribution;
