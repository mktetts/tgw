import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { NETWORKS } from '../../blockchain/networks';
import { getTransactions } from '../../helpers/helpers';
import BlockchainService from '../../blockchain/service';

function ExplorerDetails() {
    const { id } = useParams();
    const [txn, setTxn] = useState();
    const [respectiveChain, setRespectiveChains] = useState({});
    const [targetValue, setTargetValue] = useState('');
    const [sourceValue, setSourceValue] = useState('');
    const [gasPrice, setGasPrice] = useState('0')
    useEffect(() => {
        init();
    }, []);
    const init = async () => {
        if (id) {
            await BlockchainService.enableEthereum()
            const res = await getTransactions({ sourceChainTransactionHash: id });
            let respectiveChains = {};
            console.log(res.data[0])
            let allNetworks = Object.values(NETWORKS);
            const sourceChain = allNetworks.find(item => item.onChainAddress === res.data[0].sourceChain.address);
            if (sourceChain) {
                respectiveChains['sourceChain'] = NETWORKS[sourceChain.chainId];
                respectiveChains['destinationChain'] = NETWORKS[res.data[0].sourceChain.args.targetChainId];
            }
            if(res.data[0].gasPrice){
                setGasPrice(BlockchainService.getGwei((res.data[0].gasPrice.toString())))

            }
            setSourceValue(await BlockchainService.getFormattedEther(res.data[0].sourceChain.args.networkFees))
            setTargetValue(await BlockchainService.getFormattedEther(res.data[0].sourceChain.args.value))
            setRespectiveChains(respectiveChains);
            setTxn(res.data[0]);
        }
    };
   
    return (
        <div>
            {txn && respectiveChain && (
                <Container className='mt-4'>
                    <Row>
                        <Col>
                            <h1 className='mb-3'>Transaction Details</h1>
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <h4 className='mb-3'>Overview</h4>
                            <Table className='table-custom'>
                                <tbody>
                                    <tr>
                                        <td>Message Hash</td>
                                        <td>{txn.messageHash}</td>
                                    </tr>
                                    <tr>
                                        <td>Source Transaction Hash</td>
                                        <td>
                                            <a href={respectiveChain.sourceChain.explorer + txn.sourceChainTransactionHash} target='_blank'>
                                                {txn.sourceChainTransactionHash} <span className='mdi mdi-open-in-new'></span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Destination Transaction Hash</td>
                                        <td>
                                            <a href={respectiveChain.destinationChain.explorer + txn.destinationTransactionHash} target='_blank'>
                                                {txn.destinationTransactionHash} <span className='mdi mdi-open-in-new'></span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Status</td>
                                        <td>
                                            {txn.error ? (
                                                <>
                                                    <span className='text-danger'>
                                                        <i className='mdi mdi-alpha-x-circle me-1'></i>{txn.error}
                                                    </span>
                                                </>
                                            ) : (
                                                <>
                                                    <span className='text-success'>
                                                        <i className='mdi mdi-sticker-check-outline me-1'></i>Success
                                                    </span>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Source Chain</td>
                                        <td>
                                            {respectiveChain.sourceChain.image && (
                                                <img src={respectiveChain.sourceChain.image} height={20} width={20} className='me-2' />
                                            )}
                                            {respectiveChain.sourceChain.chainName}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Destination Chain</td>
                                        <td>
                                            {respectiveChain.destinationChain.image && (
                                                <img src={respectiveChain.destinationChain.image} height={20} width={20} className='me-2'/>
                                            )}
                                            {respectiveChain.destinationChain.chainName}
                                        </td>
                                    </tr>

                                    <tr>
                                        <td>From</td>
                                        <td>
                                            <a href={respectiveChain.sourceChain.cexplorer + txn.sourceChain.address} target='_blank'>
                                                {txn.sourceChain.address} <span className='mdi mdi-open-in-new'></span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>To</td>
                                        <td>
                                            <a href={respectiveChain.destinationChain.cexplorer + txn.sourceChain.args.receiver} target='_blank'>
                                                {txn.sourceChain.args.receiver} <span className='mdi mdi-open-in-new'></span>
                                            </a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Gas Price</td>
                                        <td>
                                            <a>{gasPrice} GWEI</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Paid from Source Chain</td>
                                        <td>
                                            <a>{sourceValue} {respectiveChain.sourceChain.nativeCurrency} (includes network fees)</a>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>Paid to Target Chain</td>
                                        <td>
                                            <a>{targetValue} {respectiveChain.destinationChain.nativeCurrency}</a>
                                        </td>
                                    </tr>
                                </tbody>
                            </Table>
                        </Col>
                    </Row>
                </Container>
            )}
        </div>
    );
}

export default ExplorerDetails;
