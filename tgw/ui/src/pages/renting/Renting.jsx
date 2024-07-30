import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NETWORKS } from '../../blockchain/networks';
import BlockchainService from '../../blockchain/service';
import { Button } from 'react-bootstrap';
import Spinners from '../../components/Spinners';

function Renting() {
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const data = JSON.parse(searchParams.get('state'));
    const [selectedNetwork, setSelectedNetwork] = useState({});
    const [convertedTime, setConvertedTime] = useState(null);
    useEffect(() => {
        console.log(data);
        init();
    }, []);

    const init = async () => {
        await BlockchainService.enableEthereum();
        const signer = await BlockchainService.getSignerAccount();
        // setAccountData(signer);
        setSelectedNetwork(await BlockchainService.getCurrentNetwork());

        const totalSeconds = parseInt(data.nft.duration);
        const convertedDays = Math.floor(totalSeconds / 86400);
        const convertedHours = Math.floor((totalSeconds % 86400) / 3600);
        const convertedMinutes = Math.floor((totalSeconds % 3600) / 60);
        const convertedSeconds = totalSeconds % 60;

        setConvertedTime({
            days: convertedDays,
            hours: convertedHours,
            minutes: convertedMinutes,
            seconds: convertedSeconds
        });
    };
    const changeNetwork = async () => {
        await BlockchainService.changeNetwork(NETWORKS[data.nft.sourceChainId]);
    };

    const rentNFT = async () => {
       
        try {
            setIsNFTUploading(true);
            setSpinnerMessage('Lending in Progress...');
            let res = await BlockchainService.lendNFT(data.nft.itemId, data.nft.price, data.nft.duration, data.nft.gameId, data.nft.gameName);
            if (!res.hash) return;
            setIsNFTUploading(false);
            setTransactionHash(res.hash);
            setSpinnerMessage('Lended Successfully');
        } catch (e) {
            setSpinnerMessage('Rejected');
            setTimeout(() => {
                window.location.reload();
            }, 3000);
        }
    };
    const [isNFTUploading, setIsNFTUploading] = useState(false);
    const [spinnerMessage, setSpinnerMessage] = useState('');
    const [transactionHash, setTransactionHash] = useState('');
    return (
        <div>
            <h3 className='text-center'>Confirmation for Lending NFT</h3>

            <h4 className='text-center text-primary mt-5 mb-4'>NFT Details</h4>

            <div className='ms-5'>
                <h5>
                    Token Id: <span className='text-primary'>{data.nft.itemId}</span>
                </h5>
                <h5>
                    Price:{' '}
                    <span className='text-primary'>
                        {data.nft.price} {selectedNetwork.nativeCurrency} (Renting Price)
                    </span>
                </h5>
                <h5>
                    Duration:{' '}
                    <span className='text-primary'>
                        {' '}
                        {convertedTime?.days} days, {convertedTime?.hours} hours, {convertedTime?.minutes} minutes, {convertedTime?.seconds} seconds{' '}
                    </span>
                </h5>
            </div>

            <div className='text-center justify-content-center align-item-center mt-4'>
                <Button variant='primary' disabled={selectedNetwork.chainId === data.nft.sourceChainId} className='me-4' onClick={changeNetwork}>
                    Change Network
                </Button>
                {!transactionHash && (
                    <Button variant='success' disabled={selectedNetwork.chainId !== data.nft.sourceChainId} onClick={rentNFT}>
                        Lend
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
                            href={selectedNetwork.explorer + transactionHash}
                            target='_blank'
                            className='text-center'
                        >
                            <h6 className='text-primary mt-2'>
                                {transactionHash} <span className='mdi mdi-open-in-new'></span>
                            </h6>
                        </a>
                    </>
                )}
            </div>
        </div>
    );
}

export default Renting;
