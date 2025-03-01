const express = require('express');
const bodyParser = require('body-parser');
const wallet = require('./wallet');

const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json());

// Create a new wallet
app.post('/api/wallet', async (req, res) => {
    try {
        const newWallet = await wallet.create();
        res.status(201).json(newWallet);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all wallets
app.get('/api/wallets', (req, res) => {
    res.json(wallet.getAll());
});

// Get full blockchain
app.get('/api/blockchain', async (req, res) => {
    try {
        const response = await fetch('http://localhost:3000/api/blockchain');
        const blockchainData = await response.json();
        res.json(blockchainData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Client app running at http://localhost:${port}`);
});