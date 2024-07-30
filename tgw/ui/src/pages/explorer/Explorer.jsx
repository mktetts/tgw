import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProviderService from '../../blockchain/providerService'
import { Container, Row, Col, Card, InputGroup, FormControl, Button } from 'react-bootstrap';
import { getAllNetworks, getTransactions } from '../../helpers/helpers';
import { NETWORKS } from '../../blockchain/networks';
import DataTable from 'react-data-table-component';
import BlockchainService from '../../blockchain/service';

function Explorer() {
    useEffect(() => {
        init();
    }, []);
    const [transactions, setAllTransactions] = useState([]);
    const [respectiveChain, setRespectiveChains] = useState({});
    const init = async () => {
        await BlockchainService.enableEthereum()
        await ProviderService.enableEthereum()
        const signer = await ProviderService.getSignerAccount();
        const currentNetwork = await ProviderService.getCurrentNetwork();
        const res = await getTransactions({ sender: signer.address });
        let respectiveChains = [];
        let allNetworks = Object.values(NETWORKS);
        let tx = [];
        for (let i = 0; i < res.data.length; i++) {
            const sourceChain = allNetworks.find(item => item.onChainAddress === res.data[i].sourceChain.address);
            if (sourceChain) {
                tx.push({ ...res.data[i], id: i + 1 }); 

                respectiveChains.push({
                    sourceChain: NETWORKS[sourceChain.chainId],
                    destinationChain: NETWORKS[res.data[i].sourceChain.args.targetChainId]
                });
            }
        }
        setRespectiveChains(respectiveChains);
        setAllTransactions(tx);
       
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
    const navigate = useNavigate();
    const nvaigateToDetails = txn => {
        navigate(`/main/explorer/${txn.sourceChainTransactionHash}`);
    };

    const columns = [
        {
            name: 'S.No',
            selector: row => row.id,
            sortable: true,
            width: '80px'
        },
        {
            name: 'Message Hash',
            selector: row => formatAddress(row.messageHash, 15),
            cell: row => (
                <div
                    style={{ cursor: 'pointer', color: 'blue' }} // Optional styling for clickable appearance
                    onClick={() => nvaigateToDetails(row)}
                >
                    {formatAddress(row.messageHash, 15)}
                </div>
            ),
            width: '300px'
        },
        {
            name: 'Source Chain',
            selector: row => formatAddress(row.sourceChain.contractAddress, 8),
            cell: row => (
                <div
                    style={{ cursor: 'pointer', color: 'blue' }} // Optional styling for clickable appearance
                    onClick={() => nvaigateToDetails(row)}
                >
                    <img src={respectiveChain[row.id - 1]?.sourceChain?.image} height={20} width={20} className='me-2' />{' '}
                    {formatAddress(row.sourceChain.contractAddress, 8)}
                </div>
            ),
            width: '300px'
        },
        {
            name: 'Destination Chain',
            selector: row => formatAddress(row.sourceChain.args.receiver, 8),
            cell: row => (
                <div
                    style={{ cursor: 'pointer', color: 'blue' }} // Optional styling for clickable appearance
                    onClick={() => nvaigateToDetails(row)}
                >
                    <img src={respectiveChain[row.id - 1]?.destinationChain?.image} height={20} width={20} className='me-2' />{' '}
                    {formatAddress(row.sourceChain.args.receiver, 8)}
                </div>
            ),
            width: '300px'
        },
        {
            name: 'Status',
            selector: row => row.age,
            cell: row => <>{row.error ? <span className='badge bg-danger mb-1'>Failed</span> : <span className='badge bg-success'>Success</span>}</>
        }
    ];

    const [filterText, setFilterText] = useState('');
    const [resetPaginationToggle, setResetPaginationToggle] = useState(false);

    const filteredData = transactions.filter(
        item => item.sourceChainTransactionHash && item.sourceChainTransactionHash.toLowerCase().includes(filterText.toLowerCase())
    );
    return (
        <div>
            <Container>
                <Row className='my-4'>
                    <Col>
                        <h1 className='text-center mb-3'>Relayers Explorer</h1>
                        <div className='d-flex justify-content-center mb-1'>
                            <InputGroup className='mb-3 d-flex justify-content-center align-items-center' style={{ width: '650px' }}>
                                <FormControl placeholder=' Source Tx Hash' aria-label='Message ID / Txn Hash / Address' />
                            </InputGroup>
                        </div>
                        <div className='d-flex justify-content-center mb-3'>
                            <Button variant='primary'>Search</Button>
                        </div>
                    </Col>
                </Row>
                <Row>
                    <div>
                        <DataTable
                            style={{ color: 'black' }}
                            className='custom-table'
                            title='Your Latest Transactions'
                            columns={columns}
                            data={filteredData}
                            pagination
                            paginationResetDefaultPage={resetPaginationToggle} // Reset pagination when filter changes
                            conditionalRowStyles={[
                                {
                                    when: () => true, // Apply to all rows
                                    style: {
                                        height: '60px', // Ensure the height matches the CSS class
                                        display: 'flex',
                                        alignItems: 'center'
                                    }
                                }
                            ]}
                        />
                    </div>
                </Row>
            </Container>
        </div>
    );
}

export default Explorer;
