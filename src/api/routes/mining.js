const express = require('express');
const logger = require('../../utils/logger');

function createMiningRoutes(blockchain) {
    const router = express.Router();

    /**
     * POST /api/mining
     * Mine a new block with pending transactions
     * 
     * Tested scenarios:
     * 1. Mining with no pending transactions
     *    curl -X POST http://localhost:3000/api/mining
     *    Result: 400 Bad Request - "No transactions to mine"
     * 
     * 2. Mining with pending transactions
     *    curl -X POST http://localhost:3000/api/mining
     *    Result: 200 OK with new block data
     *    - Successfully mines block
     *    - Clears pending transactions
     *    - Updates blockchain with new block
     */

    router.post('/', async (req, res) => {
        try {
            const pendingCount = blockchain.pendingTransactions.length;
            
            if (pendingCount === 0) {
                return res.status(400).json({
                    error: 'MiningError',
                    message: 'No transactions to mine'
                });
            }

            logger.info('Mining new block', {
                component: 'mining',
                pendingTransactions: pendingCount
            });

            const block = await blockchain.mineBlock();

            logger.info('Block mined successfully', {
                component: 'mining',
                blockHash: block.hash.substring(0, 8) + '...',
                transactions: block.transactions.length
            });

            res.json({
                message: 'Block mined successfully',
                block: {
                    hash: block.hash,
                    index: block.index,
                    previousHash: block.previousHash,
                    timestamp: block.timestamp,
                    transactions: block.transactions.map(tx => ({
                        hash: tx.hash,
                        from: tx.from,
                        to: tx.to,
                        amount: tx.amount
                    })),
                    nonce: block.nonce
                }
            });
        } catch (error) {
            logger.error('Mining failed', {
                component: 'mining',
                error: error.message
            });

            res.status(400).json({
                error: 'MiningError',
                message: error.message
            });
        }
    });

    /**
     * GET /api/mining/status
     * Get current mining status including pending transactions and difficulty
     * 
     * Tested scenarios:
     * 1. Get mining status
     *    curl -X GET http://localhost:3000/api/mining/status
     *    Result: 200 OK with status info:
     *    - pendingTransactions count
     *    - current difficulty (confirmed: 4)
     *    - lastBlockHash (updates after successful mining)
     */

    router.get('/status', async (req, res) => {
        try {
            const status = {
                pendingTransactions: blockchain.pendingTransactions.length,
                difficulty: blockchain.difficulty,
                lastBlockHash: blockchain.getLatestBlock().hash
            };

            logger.info('Mining status retrieved', {
                component: 'mining',
                pendingTransactions: status.pendingTransactions
            });

            res.json(status);
        } catch (error) {
            logger.error('Failed to get mining status', {
                component: 'mining',
                error: error.message
            });

            res.status(500).json({
                error: 'MiningError',
                message: 'Failed to get mining status'
            });
        }
    });

    return router;
}

// Export the route factory function
module.exports = createMiningRoutes;