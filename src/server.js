const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Blockchain, Transaction } = require('./blockchain');

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Initialize our blockchain
const vigCoin = new Blockchain();

// Routes
app.get('/blockchain', (req, res) => {
    res.json(vigCoin);
});

app.post('/transaction', (req, res) => {
    const { fromAddress, toAddress, amount } = req.body;
    
    try {
        const transaction = new Transaction(fromAddress, toAddress, amount);
        vigCoin.addTransaction(transaction);
        res.json({ message: 'Transaction added successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/mine', (req, res) => {
    const { minerAddress } = req.body;
    
    vigCoin.minePendingTransactions(minerAddress);
    res.json({ 
        message: 'Block mined successfully',
        reward: `Mining reward of ${vigCoin.miningReward} coins will be sent to ${minerAddress}`
    });
});

app.get('/balance/:address', (req, res) => {
    const balance = vigCoin.getBalanceOfAddress(req.params.address);
    res.json({
        address: req.params.address,
        balance: balance
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`VigCoin server running on port ${PORT}`);
});