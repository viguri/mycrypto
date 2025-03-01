const CryptoService = require('../services/CryptoService');

class Wallet {
    constructor() {
        this.wallets = [];
    }

    async create() {
        const response = await fetch('http://localhost:3000/api/wallet', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({}),
        });

        if (!response.ok) {
            throw new Error('Failed to create wallet: ' + response.statusText);
        }

        const walletData = await response.json();
        this.wallets.push(walletData.wallet);
        return walletData.wallet;
    }

    getAll() {
        return this.wallets;
    }
}

module.exports = new Wallet();