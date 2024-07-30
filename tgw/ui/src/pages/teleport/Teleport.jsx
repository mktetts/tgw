import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NETWORKS } from '../../blockchain/networks';
import BlockchainService from '../../blockchain/service';
import { Button } from 'react-bootstrap';
import Spinners from '../../components/Spinners';
function Teleport() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const data = JSON.parse(searchParams.get('data'));
    const [selectedNetwork, setSelectedNetwork] = useState({});
    useEffect(() => {
        console.log(data);
        init();
    }, []);

    const init = async () => {
        await BlockchainService.enableEthereum()
        const signer = await BlockchainService.getSignerAccount();
        // setAccountData(signer);
        setSelectedNetwork(await BlockchainService.getCurrentNetwork());
    };
    const changeNetwork = async () => {
        await BlockchainService.changeNetwork(NETWORKS[data.sourceChainId]);
    };
    const [isNFTUploading, setIsNFTUploading] = useState(false);
    const [spinnerMessage, setSpinnerMessage] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    const handleTeleport = async () => {
        try {
            setIsNFTUploading(true);
            setSpinnerMessage('Teleporting in Progress...');
            let res = await BlockchainService.teleportNFT(
                data.targetChainId,
                data.targetNFTAddress,
                data.gameId,
                data.itemId,
                data.price,
                data.gasPrice
            );
            if (!res.hash) return;
            setIsNFTUploading(false);
            setTransactionHash(res.hash);
            setSpinnerMessage('Teleported Successfully');
        } catch (e) {
            setSpinnerMessage(e.reason);
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    };
    return (
        <div>
            <h3 className='text-center'>Confirmation for Teleporting NFT</h3>
            <div className='text-center d-flex justify-content-center align-item-center ms-3'>
                <img src={NETWORKS[data.sourceChainId].image} width={100} height={100} />
                <div>
                    <span
                        className='mdi mdi-weather-cloudy-arrow-right text-success me-4 ms-4'
                        style={{ width: '100px', height: '100px', fontSize: '50px' }}
                    ></span>
                </div>
                <img src={NETWORKS[data.targetChainId].image} width={100} height={100} />
            </div>
            <h4 className='text-center text-primary mt-5 mb-4'>NFT Details</h4>
            <div className=''>
                <h5>
                    Game Id: <span className='text-primary'>{data.gameId}</span>
                </h5>
                <h5>
                    Token Id: <span className='text-primary'>{data.itemId}</span>
                </h5>
                <h5>
                    Price:{' '}
                    <span className='text-primary'>
                        {data.price} {selectedNetwork.nativeCurrency}
                    </span>
                </h5>
                <h5>
                    Gas Price: <span className='text-primary'>{data.gasPrice}</span>
                </h5>
            </div>

            <div className='text-center justify-content-center align-item-center'>
                <Button variant='primary' disabled={selectedNetwork.chainId === data.sourceChainId} className='me-4' onClick={changeNetwork}>
                    Change Network
                </Button>
                {!transactionHash && (
                    <Button variant='success' disabled={selectedNetwork.chainId !== data.sourceChainId} onClick={handleTeleport}>
                        Teleport
                    </Button>
                )}
            </div>
            <div className='d-flex justify-content-center align-items-center mt-3'>
                <Spinners on={isNFTUploading} />
                <h5 className='ms-2'>
                    {transactionHash && <img src='/src/assets/images/thumbsup.svg' height={30} width={40} className='mb-2' />}
                    {spinnerMessage}
                </h5>
            </div>
            <div>
                {transactionHash && (
                    <>
                        <a
                            style={{ cursor: 'pointer', textDecoration: 'none' }}
                            onMouseOver={e => (e.target.style.textDecoration = 'underline')}
                            onMouseOut={e => (e.target.style.textDecoration = 'none')}
                            href={"/main/explorer/" + transactionHash}
                            target='_blank'
                            className='text-center'
                        >
                            <h6 className='text-primary mt-2'>
                                {transactionHash} <span class='mdi mdi-open-in-new'></span>
                            </h6>
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}

export default Teleport;
