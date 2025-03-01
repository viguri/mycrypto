const CryptoService = require('../services/CryptoService');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const BlockchainStorage = require('../storage/BlockchainStorage');

class Blockchain {
    constructor() {
        this.chain = [];
        this.pendingTransactions = [];
        this.wallets = new Map();
        this.difficulty = 4;
        this._initialized = false;
        this.storage = new BlockchainStorage();
    }

    async initialize() {
        if (this._initialized) {
            logger.warn('Blockchain already initialized', {
                component: 'blockchain'
            });
            return;
        }

        logger.info('Initializing blockchain', {
            component: 'blockchain'
        });

        try {
            // Initialize storage
            await this.storage.initialize();

            // Load saved state
            await this.loadState();

            // Create genesis block if chain is empty
            if (this.chain.length === 0) {
                const genesisBlock = await this.createGenesisBlock();
                this.chain = [genesisBlock];
                await this.saveState();
            }

            this._initialized = true;

            logger.info('Blockchain initialized', {
                component: 'blockchain',
                genesisHash: this.chain[0].hash,
                walletCount: this.wallets.size,
                blockCount: this.chain.length
            });

            return true;
        } catch (error) {
            logger.error('Failed to initialize blockchain', {
                component: 'blockchain',
                error: error.message,
                critical: true
            });
            throw error;
        }
    }

    async loadState() {
        try {
            // Load chain
            this.chain = await this.storage.loadChain();
            
            // Load wallets
            this.wallets = await this.storage.loadWallets();
            
            // Load pending transactions
            this.pendingTransactions = await this.storage.loadPendingTransactions();

            logger.info('Blockchain state loaded', {
                component: 'blockchain',
                blocks: this.chain.length,
                wallets: this.wallets.size,
                pending: this.pendingTransactions.length
            });
        } catch (error) {
            logger.error('Failed to load blockchain state', {
                component: 'blockchain',
                error: error.message
            });
            // Reset state to defaults
            this.chain = [];
            this.wallets = new Map();
            this.pendingTransactions = [];
        }
    }

    async saveState() {
        try {
            await this.storage.saveChain(this.chain);
            await this.storage.saveWallets(this.wallets);
            await this.storage.savePendingTransactions(this.pendingTransactions);

            logger.info('Blockchain state saved', {
                component: 'blockchain',
                blocks: this.chain.length,
                wallets: this.wallets.size,
                pending: this.pendingTransactions.length
            });
        } catch (error) {
            logger.error('Failed to save blockchain state', {
                component: 'blockchain',
                error: error.message
            });
            throw error;
        }
    }

    async createGenesisBlock() {
        const block = {
            index: 0,
            timestamp: 1740682000000, // Fixed timestamp for genesis block
            transactions: [],
            previousHash: '0',
            nonce: 0
        };

        block.merkleRoot = await CryptoService.hash('genesis');
        block.hash = await CryptoService.generateBlockHash({
            ...block,
            merkleRoot: block.merkleRoot
        });

        logger.info('Genesis block created', {
            component: 'blockchain',
            hash: block.hash
        });

        return block;
    }

    getLatestBlock() {
        if (!this.chain.length) {
            throw new Error('Blockchain not initialized');
        }
        return this.chain[this.chain.length - 1];
    }

    // Wallet methods
    hasWallet(address) {
        return this.wallets.has(address);
    }

    async addWallet(wallet) {
        if (!this._initialized) {
            throw new Error('Blockchain not initialized');
        }

        if (!wallet || !wallet.address) {
            throw new Error('Invalid wallet data');
        }

        if (this.hasWallet(wallet.address)) {
            throw new Error('Wallet already exists');
        }

        this.wallets.set(wallet.address, {
            ...wallet,
            balance: wallet.balance || 1000, // Initial balance
            createdAt: wallet.createdAt || Date.now()
        });

        logger.info('Wallet added to blockchain', {
            component: 'blockchain',
            address: wallet.address.substring(0, 8) + '...',
            walletCount: this.wallets.size
        });

        await this.saveState();
    }

    getWallet(address) {
        return this.wallets.get(address);
    }

    getWalletCount() {
        return this.wallets.size;
    }
    
    getAllWallets() {
        try {
            const walletsList = [];
            this.wallets.forEach((wallet, address) => {
                walletsList.push({
                    address,
                    balance: wallet.balance,
                    createdAt: wallet.createdAt,
                    transactionCount: this.getWalletTransactionCount(address)
                });
            });
            return walletsList;
        } catch (error) {
            logger.error('Failed to get all wallets', {
                component: 'blockchain',
                error: error.message
            });
            throw new Error('Failed to retrieve wallet list');
        }
    }

    getWalletBalance(address) {
        const wallet = this.getWallet(address);
        if (!wallet) {
            throw new Error('Wallet not found');
        }
        return wallet.balance;
    }

    getWalletTransactionCount(address) {
        return this.chain.reduce((count, block) => {
            return count + block.transactions.filter(tx => 
                tx.from === address || tx.to === address
            ).length;
        }, 0) + this.pendingTransactions.filter(tx =>
            tx.from === address || tx.to === address
        ).length;
    }

    // Transaction methods
    async addTransaction(from, to, amount) {
        if (!this._initialized) {
            throw new Error('Blockchain not initialized');
        }

        if (!this.hasWallet(from)) {
            throw new Error('Sender wallet not found');
        }
        if (!this.hasWallet(to)) {
            throw new Error('Recipient wallet not found');
        }

        amount = parseFloat(amount);
        if (isNaN(amount) || amount <= 0) {
            throw new Error('Invalid amount');
        }

        const senderWallet = this.getWallet(from);
        if (senderWallet.balance < amount) {
            throw new Error('Insufficient balance');
        }

        const transaction = {
            hash: null,
            from,
            to,
            amount,
            timestamp: Date.now(),
            nonce: uuidv4()
        };

        transaction.hash = CryptoService.generateTransactionHash(transaction);
        
        this.pendingTransactions.push(transaction);
        
        logger.info('Transaction added to pool', {
            component: 'blockchain',
            hash: transaction.hash.substring(0, 8) + '...',
            amount: transaction.amount
        });

        await this.saveState();
        return transaction;
    }

    // Mining methods
    async mineBlock() {
        if (!this._initialized) {
            throw new Error('Blockchain not initialized');
        }

        if (this.pendingTransactions.length === 0) {
            throw new Error('No transactions to mine');
        }

        const block = {
            index: this.chain.length,
            timestamp: Date.now(),
            transactions: [...this.pendingTransactions],
            previousHash: this.getLatestBlock().hash,
            nonce: 0
        };

        block.merkleRoot = await CryptoService.hash(
            block.transactions.map(tx => tx.hash).join('')
        );
        
        block.hash = await CryptoService.generateBlockHash({
            ...block,
            merkleRoot: block.merkleRoot
        });

        // Process transactions
        for (const tx of block.transactions) {
            const sender = this.wallets.get(tx.from);
            const recipient = this.wallets.get(tx.to);
            
            if (!sender || !recipient) {
                logger.error('Invalid transaction - wallet not found', {
                    component: 'blockchain',
                    transaction: tx.hash
                });
                continue;
            }

            sender.balance -= tx.amount;
            recipient.balance += tx.amount;

            // Add block reference to transaction
            tx.blockHash = block.hash;
            tx.blockIndex = block.index;
        }

        this.chain.push(block);
        this.pendingTransactions = [];

        logger.info('Block mined', {
            component: 'blockchain',
            blockHash: block.hash.substring(0, 8) + '...',
            transactions: block.transactions.length
        });

        await this.saveState();
        return block;
    }
}

module.exports = Blockchain;