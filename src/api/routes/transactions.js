const express = require('express');
const logger = require('../../utils/logger');

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const transactionRoutes = (blockchain) => {
    const router = express.Router();

    /**
     * POST /api/transactions
     * Create a new transaction
     * 
     * Tested scenarios:
     * 1. Create valid transaction
     *    curl -X POST http://localhost:3000/api/transactions \
     *         -H "Content-Type: application/json" \
     *         -d '{
     *           "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
     *           "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
     *           "amount": 50
     *         }'
     *    Result: 201 Created
     *    - Transaction added to pending transactions
     *    - Ready for mining
     */
    router.post('/', asyncHandler(async (req, res) => {
        const { from, to, amount } = req.body;

        try {
            logger.info('Processing new transaction', {
                component: 'transactions',
                from: from?.substring(0, 8) + '...',
                to: to?.substring(0, 8) + '...',
                amount
            });

            if (!from || !to || !amount) {
                throw new Error('Missing required transaction data');
            }

            const transaction = await blockchain.addTransaction(from, to, amount);

            logger.info('Transaction created', {
                component: 'transactions',
                hash: transaction.hash.substring(0, 8) + '...',
                amount
            });

            res.status(201).json({
                message: 'Transaction created successfully',
                transaction: {
                    hash: transaction.hash,
                    from,
                    to,
                    amount,
                    timestamp: transaction.timestamp
                }
            });

        } catch (error) {
            logger.error('Transaction failed', {
                component: 'transactions',
                error: error.message,
                from: from?.substring(0, 8) + '...',
                to: to?.substring(0, 8) + '...',
                amount
            });

            res.status(400).json({
                error: 'TransactionError',
                message: error.message
            });
        }
    }));

    /**
     * GET /api/transactions/pending
     * Get list of pending transactions
     * 
     * Tested scenarios:
     * 1. Get pending transactions
     *    curl -X GET http://localhost:3000/api/transactions/pending
     *    Result: 200 OK with array of transactions
     *    - Shows correct count
     *    - Lists all pending transactions with details
     */
    router.get('/pending', asyncHandler(async (req, res) => {
        try {
            const transactions = blockchain.pendingTransactions;

            logger.info('Pending transactions retrieved', {
                component: 'transactions',
                count: transactions.length
            });

            res.json({
                count: transactions.length,
                transactions: transactions.map(tx => ({
                    hash: tx.hash,
                    from: tx.from,
                    to: tx.to,
                    amount: tx.amount,
                    timestamp: tx.timestamp
                }))
            });

        } catch (error) {
            logger.error('Failed to get pending transactions', {
                component: 'transactions',
                error: error.message
            });

            res.status(500).json({
                error: 'TransactionError',
                message: 'Failed to get pending transactions'
            });
        }
    }));

    // Get transactions by wallet address
    router.get('/wallet/:address', asyncHandler(async (req, res) => {
        const { address } = req.params;

        try {
            logger.info('Retrieving wallet transactions', {
                component: 'transactions',
                address: address.substring(0, 8) + '...'
            });

            let transactions = [];

            // Check pending transactions
            transactions.push(...blockchain.pendingTransactions.filter(tx => 
                tx.from === address || tx.to === address
            ));

            // Check confirmed transactions in blocks
            blockchain.chain.forEach(block => {
                transactions.push(...block.transactions.filter(tx =>
                    tx.from === address || tx.to === address
                ));
            });

            // Sort by timestamp descending (newest first)
            transactions.sort((a, b) => b.timestamp - a.timestamp);

            logger.info('Wallet transactions retrieved', {
                component: 'transactions',
                address: address.substring(0, 8) + '...',
                count: transactions.length
            });

            res.json(transactions.map(tx => ({
                hash: tx.hash,
                from: tx.from,
                to: tx.to,
                amount: tx.amount,
                timestamp: tx.timestamp,
                status: tx.blockHash ? 'confirmed' : 'pending'
            })));

        } catch (error) {
            logger.error('Failed to get wallet transactions', {
                component: 'transactions',
                error: error.message,
                address: address?.substring(0, 8) + '...'
            });

            res.status(500).json({
                error: 'TransactionError',
                message: 'Failed to get wallet transactions'
            });
        }
    }));

    // Get transaction by hash
    router.get('/:hash', asyncHandler(async (req, res) => {
        const { hash } = req.params;

        try {
            // Look in pending transactions first
            let transaction = blockchain.pendingTransactions.find(tx => tx.hash === hash);

            if (!transaction) {
                // Look in mined blocks
                blockchain.chain.some(block => {
                    transaction = block.transactions.find(tx => tx.hash === hash);
                    return transaction;
                });
            }

            if (!transaction) {
                logger.warn('Transaction not found', {
                    component: 'transactions',
                    hash: hash.substring(0, 8) + '...'
                });

                return res.status(404).json({
                    error: 'NotFound',
                    message: 'Transaction not found'
                });
            }

            logger.info('Transaction retrieved', {
                component: 'transactions',
                hash: transaction.hash.substring(0, 8) + '...'
            });

            res.json({
                hash: transaction.hash,
                from: transaction.from,
                to: transaction.to,
                amount: transaction.amount,
                timestamp: transaction.timestamp,
                status: transaction.blockHash ? 'confirmed' : 'pending'
            });

        } catch (error) {
            logger.error('Failed to get transaction', {
                component: 'transactions',
                error: error.message,
                hash: hash?.substring(0, 8) + '...'
            });

            res.status(500).json({
                error: 'TransactionError',
                message: 'Failed to get transaction'
            });
        }
    }));

    return router;
};

module.exports = transactionRoutes;