const express = require('express');
const logger = require('../../utils/logger');

// Async handler wrapper
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const blockchainRoutes = (blockchain) => {
    const router = express.Router();

    // Get full blockchain
    router.get('/', asyncHandler(async (req, res) => {
        logger.info('Getting full blockchain', {
            component: 'blockchain',
            chainLength: blockchain.chain.length,
            pendingTransactions: blockchain.pendingTransactions.length
        });

        res.json({
            chain: blockchain.chain,
            pendingTransactions: blockchain.pendingTransactions
        });
    }));

    // Get specific block
    router.get('/:hash', asyncHandler(async (req, res) => {
        const block = blockchain.getBlock(req.params.hash);
        if (!block) {
            logger.warn('Block not found', { 
                hash: req.params.hash,
                critical: true 
            });
            return res.status(404).json({
                error: 'BlockNotFound',
                message: 'Block with specified hash not found'
            });
        }

        logger.info('Block retrieved', { 
            component: 'blockchain',
            hash: block.hash
        });
        res.json(block);
    }));

    // Get chain status
    router.get('/status', asyncHandler(async (req, res) => {
        const status = {
            blocks: blockchain.chain.length,
            lastBlock: blockchain.getLatestBlock(),
            isValid: blockchain.isChainValid(),
            pendingTransactions: blockchain.pendingTransactions.length
        };

        logger.info('Chain status requested', {
            component: 'blockchain',
            blocks: status.blocks,
            isValid: status.isValid
        });
        res.json(status);
    }));

    return router;
};

module.exports = blockchainRoutes;