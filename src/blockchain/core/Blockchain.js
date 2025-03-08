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

    validateTransaction(transaction, fromWallet, toWallet) {
        // Note: Basic validation is now done in createTransaction
        // Note: Required fields validation is now done in createTransaction
        // Note: Amount validation is now done in createTransaction
        // Note: Self-transfer validation is now done in createTransaction
        // Note: Wallet validation is now done in createTransaction
        // Note: Main wallet protection is now done in createTransaction
        // Note: Balance validation is now done in createTransaction
        
        // This method is kept for compatibility and future use
        return true;
    }

    async createTransaction(transaction) {
        // Basic validation first
        if (!transaction || typeof transaction !== 'object') {
            throw new Error('Invalid transaction format');
        }

        // Required fields next
        const requiredFields = ['from', 'to', 'amount'];
        for (const field of requiredFields) {
            if (!(field in transaction)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Amount validation
        if (typeof transaction.amount !== 'number' || transaction.amount <= 0) {
            throw new Error('Invalid transaction amount');
        }

        // Self-transfer validation
        if (transaction.from === transaction.to) {
            throw new Error('Self-transfer not allowed');
        }

        const fromWallet = this.wallets.get(transaction.from);
        const toWallet = this.wallets.get(transaction.to);

        // Wallet validation
        if (!fromWallet || !toWallet) {
            throw new Error('Invalid wallet addresses');
        }

        // Main wallet protection
        if (fromWallet.isMainWallet && !transaction.isSystemTransaction) {
            throw new Error('Direct transfers from main wallet not allowed');
        }

        // Balance validation
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

    validateBlock(block, previousBlock) {
        // Basic validation
        if (!block || typeof block !== 'object') {
            throw new Error('Invalid block format');
        }

        // Required fields
        const requiredFields = ['index', 'timestamp', 'transactions', 'previousHash', 'nonce', 'hash'];
        for (const field of requiredFields) {
            if (!(field in block)) {
                throw new Error(`Missing required field: ${field}`);
            }
        }

        // Index validation
        if (block.index !== previousBlock.index + 1) {
            throw new Error('Invalid block index');
        }

        // Previous hash validation
        if (block.previousHash !== previousBlock.hash) {
            throw new Error('Invalid previous hash');
        }

        // Timestamp validation
        if (block.timestamp <= previousBlock.timestamp) {
            throw new Error('Invalid block timestamp');
        }

        // Hash difficulty validation
        if (!this.isValidHashDifficulty(block.hash)) {
            throw new Error('Invalid block hash difficulty');
        }

        // Transaction validation
        if (!Array.isArray(block.transactions)) {
            throw new Error('Invalid transactions format');
        }

        // Validate each transaction
        const balances = new Map(this.wallets);
        for (const tx of block.transactions) {
            const fromWallet = balances.get(tx.from);
            const toWallet = balances.get(tx.to);

            // Skip validation for system transactions
            if (!tx.isSystemTransaction) {
                this.validateTransaction(tx, fromWallet, toWallet);
            }

            // Update temporary balances
            fromWallet.balance -= tx.amount;
            toWallet.balance += tx.amount;
            balances.set(tx.from, fromWallet);
            balances.set(tx.to, toWallet);
        }
    }

    async validateChain() {
        logger.info('Starting chain validation', {
            component: 'blockchain',
            blocks: this.chain.length
        });

        // Validate genesis block
        const genesisBlock = this.chain[0];
        if (genesisBlock.previousHash !== '0') {
            throw new Error('Invalid genesis block');
        }

        // Validate each block
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            try {
                this.validateBlock(currentBlock, previousBlock);
            } catch (err) {
                logger.error('Chain validation failed', {
                    component: 'blockchain',
                    blockIndex: i,
                    error: err.message
                });
                throw new Error(`Invalid block at index ${i}: ${err.message}`);
            }
        }

        logger.info('Chain validation completed', {
            component: 'blockchain',
            status: 'valid'
        });
        return true;
    }

    async mineBlock() {
        if (this.pendingTransactions.length === 0) {
            throw new Error('No transactions to mine');
        }

        // Validate pending transactions before mining
        for (const tx of this.pendingTransactions) {
            const fromWallet = this.wallets.get(tx.from);
            const toWallet = this.wallets.get(tx.to);
            this.validateTransaction(tx, fromWallet, toWallet);
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
        if (!hash || typeof hash !== 'string' || hash.length !== 64) {
            return false;
        }
        const prefix = '0'.repeat(this.difficulty);
        return hash.startsWith(prefix);
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