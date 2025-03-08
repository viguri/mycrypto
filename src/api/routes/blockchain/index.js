import express from 'express';
import { createBlockchainSecurityMiddleware } from '../../../middleware/blockchain-security.js';
import logger from '../../../utils/logger/index.js';

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const blockchainRoutes = (blockchain) => {
    const router = express.Router();
    const security = createBlockchainSecurityMiddleware();

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

    // Submit new block (mining)
    router.post('/block', 
        security.block,
        security.mining,
        asyncHandler(async (req, res) => {
            try {
                const block = req.body;
                await blockchain.addBlock(block);
                
                logger.info('New block added to chain', {
                    component: 'blockchain',
                    height: block.height,
                    hash: block.hash,
                    transactions: block.transactions.length
                });

                res.json({
                    message: 'Block accepted',
                    height: block.height,
                    hash: block.hash
                });
            } catch (error) {
                logger.error('Failed to add block', {
                    component: 'blockchain',
                    error: error.message
                });

                res.status(400).json({
                    error: 'InvalidBlock',
                    message: error.message
                });
            }
    }));

    // Submit new transaction
    router.post('/transaction', 
        security.transaction,
        asyncHandler(async (req, res) => {
            try {
                const transaction = req.body;
                await blockchain.addTransaction(transaction);
                
                logger.info('New transaction added to pool', {
                    component: 'blockchain',
                    transactionId: transaction.id,
                    inputs: transaction.inputs.length,
                    outputs: transaction.outputs.length
                });

                res.json({
                    message: 'Transaction accepted',
                    id: transaction.id
                });
            } catch (error) {
                logger.error('Failed to add transaction', {
                    component: 'blockchain',
                    error: error.message
                });

                res.status(400).json({
                    error: 'InvalidTransaction',
                    message: error.message
                });
            }
    }));

    return router;
};

export default blockchainRoutes;