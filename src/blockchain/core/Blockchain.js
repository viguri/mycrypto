import logger from '../../utils/logger/index.js';
import CryptoService from '../../services/CryptoService.js';
import BlockchainStorage from '../../storage/blockchain/BlockchainStorage.js';

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.wallets = new Map();
        this.difficulty = 4;
        this.storage = new BlockchainStorage();
    }

    async initialize() {
        logger.info('Initializing blockchain', {
            component: 'blockchain'
        });

        await this.storage.initialize();
        const state = await this.storage.loadState();

        if (state.chain.length === 0) {
            await this.createGenesisBlock();
        } else {
            this.chain = state.chain;
            this.wallets = new Map(state.wallets);
            this.pendingTransactions = state.pendingTransactions || [];
        }

        logger.info('Blockchain initialized', {
            component: 'blockchain',
            genesisHash: this.chain[0].hash,
            walletCount: this.wallets.size,
            blockCount: this.chain.length
        });
    }

    async createGenesisBlock() {
        const genesisBlock = {
            index: 0,
            timestamp: Date.now(),
            transactions: [],
            previousHash: '0',
            nonce: 0,
            hash: ''
        };

        genesisBlock.hash = await CryptoService.generateBlockHash(genesisBlock);
        this.chain.push(genesisBlock);
        
        // Create main wallet in genesis
        await this.addWallet({
            address: 'main_wallet',
            balance: 1000000,
            createdAt: Date.now(),
            isMainWallet: true
        });

        await this.saveState();
    }

    async addWallet(wallet) {
        this.wallets.set(wallet.address, wallet);
        await this.saveState();
        return wallet;
    }

    getWallet(address) {
        return this.wallets.get(address);
    }

    hasWallet(address) {
        return this.wallets.has(address);
    }

    getAllWallets() {
        return Array.from(this.wallets.values());
    }

    getWalletCount() {
        return this.wallets.size;
    }

    async removeWallet(address) {
        if (this.wallets.has(address)) {
            const wallet = this.wallets.get(address);
            if (wallet.balance > 0) {
                // Transfer remaining balance to main wallet
                await this.createTransaction({
                    from: address,
                    to: 'main_wallet',
                    amount: wallet.balance
                });
                await this.mineBlock();
            }
            this.wallets.delete(address);
            await this.saveState();
        }
    }

    getWalletTransactionCount(address) {
        let count = 0;
        for (const block of this.chain) {
            count += block.transactions.filter(tx => 
                tx.from === address || tx.to === address
            ).length;
        }
        count += this.pendingTransactions.filter(tx =>
            tx.from === address || tx.to === address
        ).length;
        return count;
    }

    async createTransaction(transaction) {
        const fromWallet = this.wallets.get(transaction.from);
        const toWallet = this.wallets.get(transaction.to);

        if (!fromWallet || !toWallet) {
            throw new Error('Invalid wallet addresses');
        }

        if (fromWallet.balance < transaction.amount) {
            throw new Error('Insufficient funds');
        }

        const tx = {
            ...transaction,
            timestamp: Date.now(),
            nonce: Math.floor(Math.random() * 1000000),
            status: 'pending'
        };

        tx.hash = CryptoService.generateTransactionHash(tx);
        this.pendingTransactions.push(tx);
        await this.saveState();

        return tx;
    }

    async mineBlock() {
        if (this.pendingTransactions.length === 0) {
            throw new Error('No transactions to mine');
        }

        const block = {
            index: this.chain.length,
            timestamp: Date.now(),
            transactions: [...this.pendingTransactions],
            previousHash: this.chain[this.chain.length - 1].hash,
            nonce: 0
        };

        // Find valid hash
        while (!this.isValidHashDifficulty(block.hash)) {
            block.nonce++;
            block.hash = await CryptoService.generateBlockHash(block);
        }

        // Process transactions
        for (const tx of block.transactions) {
            const fromWallet = this.wallets.get(tx.from);
            const toWallet = this.wallets.get(tx.to);

            fromWallet.balance -= tx.amount;
            toWallet.balance += tx.amount;
            tx.status = 'completed';
        }

        this.chain.push(block);
        this.pendingTransactions = [];
        await this.saveState();

        return block;
    }

    isValidHashDifficulty(hash) {
        const prefix = '0'.repeat(this.difficulty);
        return hash && hash.startsWith(prefix);
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    async saveState() {
        const state = {
            chain: this.chain,
            wallets: Array.from(this.wallets.entries()),
            pendingTransactions: this.pendingTransactions
        };

        await this.storage.saveState(state);

        logger.info('Blockchain state saved', {
            component: 'blockchain',
            blocks: this.chain.length,
            wallets: this.wallets.size,
            pending: this.pendingTransactions.length
        });
    }
}

export default Blockchain;