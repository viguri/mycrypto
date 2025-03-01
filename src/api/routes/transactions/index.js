import express from 'express';
import logger from '../../../utils/logger/index.js';

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const transactionRoutes = (blockchain) => {
    const router = express.Router();

    // Create new transaction
    router.post('/', asyncHandler(async (req, res) => {
        try {
            const { from, to, amount } = req.body;

            if (!from || !to || !amount) {
                return res.status(400).json({
                    error: 'ValidationError',
                    message: 'Missing required fields'
                });
            }

            const transaction = await blockchain.createTransaction({
                from,
                to,
                amount: parseFloat(amount)
            });

            logger.info('New transaction created', {
                component: 'transactions',
                hash: transaction.hash.substring(0, 8) + '...',
                from: from.substring(0, 8) + '...',
                to: to.substring(0, 8) + '...',
                amount
            });

            res.status(201).json({
                message: 'Transaction created successfully',
                transaction
            });
        } catch (error) {
            logger.error('Failed to create transaction', {
                component: 'transactions',
                error: error.message
            });
            throw error;
        }
    }));

    // Get all pending transactions
    router.get('/pending', asyncHandler(async (req, res) => {
        try {
            logger.info('Getting pending transactions', {
                component: 'transactions',
                count: blockchain.pendingTransactions.length
            });

            res.json({
                message: 'Pending transactions retrieved',
                transactions: blockchain.pendingTransactions
            });
        } catch (error) {
            logger.error('Failed to get pending transactions', {
                component: 'transactions',
                error: error.message
            });
            throw error;
        }
    }));

    // Get transaction by hash
    router.get('/:hash', asyncHandler(async (req, res) => {
        try {
            const { hash } = req.params;

            // Search in pending transactions
            let transaction = blockchain.pendingTransactions.find(tx => tx.hash === hash);

            // If not found in pending, search in blocks
            if (!transaction) {
                for (const block of blockchain.chain) {
                    transaction = block.transactions.find(tx => tx.hash === hash);
                    if (transaction) break;
                }
            }

            if (!transaction) {
                return res.status(404).json({
                    error: 'NotFound',
                    message: 'Transaction not found'
                });
            }

            logger.info('Transaction retrieved', {
                component: 'transactions',
                hash: hash.substring(0, 8) + '...',
                status: transaction.status
            });

            res.json(transaction);
        } catch (error) {
            logger.error('Failed to get transaction', {
                component: 'transactions',
                error: error.message
            });
            throw error;
        }
    }));

    // Get transactions by wallet address
    router.get('/wallet/:address', asyncHandler(async (req, res) => {
        try {
            const { address } = req.params;

            if (!blockchain.hasWallet(address)) {
                return res.status(404).json({
                    error: 'NotFound',
                    message: 'Wallet not found'
                });
            }

            const transactions = [];

            // Get transactions from blocks
            for (const block of blockchain.chain) {
                transactions.push(...block.transactions.filter(tx => 
                    tx.from === address || tx.to === address
                ));
            }

            // Add pending transactions
            transactions.push(...blockchain.pendingTransactions.filter(tx =>
                tx.from === address || tx.to === address
            ));

            logger.info('Wallet transactions retrieved', {
                component: 'transactions',
                address: address.substring(0, 8) + '...',
                count: transactions.length
            });

            res.json({
                message: 'Wallet transactions retrieved',
                transactions
            });
        } catch (error) {
            logger.error('Failed to get wallet transactions', {
                component: 'transactions',
                error: error.message
            });
            throw error;
        }
    }));

    return router;
};

export default transactionRoutes;