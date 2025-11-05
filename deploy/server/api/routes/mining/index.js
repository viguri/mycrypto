import express from 'express';
import logger from '../../../utils/logger/index.js';

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const miningRoutes = (blockchain) => {
    const router = express.Router();

    // Mine pending transactions
    router.post('/mine', asyncHandler(async (req, res) => {
        try {
            if (blockchain.pendingTransactions.length === 0) {
                return res.status(400).json({
                    error: 'MiningError',
                    message: 'No transactions to mine'
                });
            }

            logger.info('Starting mining process', {
                component: 'mining',
                pendingCount: blockchain.pendingTransactions.length
            });

            const block = await blockchain.mineBlock();

            logger.info('Block mined successfully', {
                component: 'mining',
                blockHash: block.hash.substring(0, 8) + '...',
                transactions: block.transactions.length,
                blockIndex: block.index
            });

            res.json({
                message: 'Block mined successfully',
                block: {
                    hash: block.hash,
                    index: block.index,
                    transactionCount: block.transactions.length,
                    timestamp: block.timestamp,
                    nonce: block.nonce
                }
            });
        } catch (error) {
            logger.error('Mining failed', {
                component: 'mining',
                error: error.message
            });

            if (error.message === 'No transactions to mine') {
                return res.status(400).json({
                    error: 'MiningError',
                    message: error.message
                });
            }

            throw error;
        }
    }));

    // Get mining stats
    router.get('/stats', asyncHandler(async (req, res) => {
        try {
            const stats = {
                difficulty: blockchain.difficulty,
                pendingTransactions: blockchain.pendingTransactions.length,
                lastBlockHash: blockchain.getLatestBlock().hash,
                totalBlocks: blockchain.chain.length
            };

            logger.info('Mining stats retrieved', {
                component: 'mining',
                stats
            });

            res.json({
                message: 'Mining stats retrieved',
                stats
            });
        } catch (error) {
            logger.error('Failed to get mining stats', {
                component: 'mining',
                error: error.message
            });
            throw error;
        }
    }));

    return router;
};

export default miningRoutes;