import React, { useEffect, useState, createContext, useRef } from 'react';
import io from 'socket.io-client';

export const socketContext = createContext();

const SocketConnection = ({ children }) => {
    const [TGWServer, setTGWServer] = useState(null);
    const [priceServer, setPriceServer] = useState(null);
    useEffect(() => {
        connectToSockets();
    }, []);
    const connectToSockets = async () => {
        try {
            let socket = io(import.meta.env.VITE_APP_TGW_SERVER, {
                transports: ['websocket']
            });
            setTGWServer(socket);
            socket = io(import.meta.env.VITE_APP_PRICE_SERVER, {
                transports: ['websocket']
            });
            setPriceServer(socket);
        } catch (e) {
            console.log(e);
        }
    };
    return <socketContext.Provider value={{ TGWServer, priceServer }}>{children}</socketContext.Provider>;
};

export default SocketConnection;
