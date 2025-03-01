import express from 'express';
import logger from '../../../utils/logger/index.js';

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const blockchainRoutes = (blockchain) => {
    const router = express.Router();

    // Get full blockchain
    router.get('/', asyncHandler(async (req, res) => {
        try {
            logger.info('Getting full blockchain', {
                component: 'blockchain',
                chainLength: blockchain.chain.length,
                pendingTransactions: blockchain.pendingTransactions.length
            });

            res.json({
                chain: blockchain.chain,
                pendingTransactions: blockchain.pendingTransactions,
                stats: {
                    blockCount: blockchain.chain.length,
                    pendingCount: blockchain.pendingTransactions.length,
                    walletCount: blockchain.getWalletCount()
                }
            });
        } catch (error) {
            logger.error('Failed to get blockchain', {
                component: 'blockchain',
                error: error.message
            });
            throw error;
        }
    }));

    // Get block by index
    router.get('/block/:index', asyncHandler(async (req, res) => {
        const index = parseInt(req.params.index);

        if (isNaN(index) || index < 0) {
            return res.status(400).json({
                error: 'InvalidIndex',
                message: 'Invalid block index'
            });
        }

        const block = blockchain.chain[index];
        if (!block) {
            return res.status(404).json({
                error: 'NotFound',
                message: 'Block not found'
            });
        }

        logger.info('Block retrieved', {
            component: 'blockchain',
            blockIndex: index,
            transactions: block.transactions.length
        });

        res.json(block);
    }));

    // Get blockchain statistics
    router.get('/stats', asyncHandler(async (req, res) => {
        try {
            const stats = {
                blockCount: blockchain.chain.length,
                pendingTransactions: blockchain.pendingTransactions.length,
                walletCount: blockchain.getWalletCount(),
                lastBlockHash: blockchain.getLatestBlock().hash,
                difficulty: blockchain.difficulty
            };

            logger.info('Retrieved blockchain stats', {
                component: 'blockchain',
                stats
            });

            res.json(stats);
        } catch (error) {
            logger.error('Failed to get blockchain stats', {
                component: 'blockchain',
                error: error.message
            });
            throw error;
        }
    }));

    return router;
};

export default blockchainRoutes;