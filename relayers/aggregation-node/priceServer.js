const { Server } = require('socket.io');
const express = require('express');
const http = require('http');
const fetch = require('node-fetch');

class PriceServer {
    constructor(namespace, apiUrl, apiKey, interval) {
        this.namespace = namespace;
        this.apiUrl = apiUrl;
        this.apiKey = apiKey;
        this.interval = interval;
        this.initServer()
        this.startFetchingData();
        this.latestPrice = {}
    }

    initServer() {
       
        this.namespace.on('connection', (socket) => {
            console.log('Price Fetching User Connected');
            socket.on('disconnect', () => {
                // console.log('User disconnected');
            });
            socket.on('latestPrice', () => {
                this.namespace.emit('latestPrice', this.latestPrice);
            });
        });
    }

    async fetchData() {
        const options = {
            method: 'GET',
            headers: {
                accept: 'application/json',
                'x-cg-demo-api-key': this.apiKey
            }
        };

        try {
            const response = await fetch(this.apiUrl, options);
            const data = await response.json();
            const eth = data.find((item) => item.symbol === 'eth');
            const avax = data.find((item) => item.symbol === 'avax');
            const bnb = data.find((item) => item.symbol === 'bnb');
            const matic = data.find((item) => item.symbol === 'matic');
            this.latestPrice = {
                ETH : eth.current_price,
                AVAX : avax.current_price,
                tBNB : bnb.current_price,
                TFUEL: 0.0662,
                XDAI: 0.9909,
                MATIC: matic.current_price
            }
            // console.log(this.latestPrice)
            // Broadcast the data to all connected clients
            this.namespace.emit('latestPrice', data);
        } catch (err) {
            console.error(err);
        }
    }

    startFetchingData() {
        this.fetchData();
        setInterval(() => this.fetchData(), this.interval);
    }
}

module.exports = PriceServer;
