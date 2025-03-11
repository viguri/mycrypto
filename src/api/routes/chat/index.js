import express from 'express';
import rateLimit from 'express-rate-limit';
import OpenAIService from '../../../services/OpenAIService.js';
import logger from '../../../utils/logger/index.js';
import { success, error, ErrorTypes } from '../../../utils/response/index.js';

const router = express.Router();

// Stricter rate limit for AI endpoints to prevent abuse
const chatLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 requests per windowMs
    message: {
        error: 'TooManyRequests',
        message: 'Too many chat requests, please try again later'
    }
});

export default (blockchain) => {
    // Chat endpoint
    router.post('/', chatLimiter, async (req, res) => {
        try {
            const { message, walletAddress } = req.body;

            if (!message) {
                return res.status(400).json(error(
                    'Message is required',
                    ErrorTypes.VALIDATION,
                    400
                ));
            }

            // Get context for the AI
            let context = {};
            if (walletAddress) {
                try {
                    const wallet = await blockchain.getWallet(walletAddress);
                    if (wallet) {
                        context.walletAddress = walletAddress;
                        context.balance = wallet.balance;

                        // Get last transaction
                        const transactions = [];
                        for (const block of blockchain.chain) {
                            transactions.push(...block.transactions.filter(tx => 
                                tx.from === walletAddress || tx.to === walletAddress
                            ));
                        }
                        if (transactions.length > 0) {
                            context.lastTransaction = transactions[transactions.length - 1];
                        }
                    }
                } catch (err) {
                    logger.warn('Failed to get wallet context', {
                        component: 'chat',
                        error: err.message,
                        walletAddress
                    });
                }
            }

            // Generate AI response
            const { response, usage } = await OpenAIService.generateResponse(message, context);

            logger.info('Chat response generated', {
                component: 'chat',
                messageLength: message.length,
                responseLength: response.length,
                tokensUsed: usage.total_tokens,
                walletAddress: context.walletAddress || 'none'
            });

            res.json(success({
                response,
                usage
            }));
        } catch (err) {
            logger.error('Chat error', {
                component: 'chat',
                error: err.message,
                stack: err.stack
            });

            if (err.response?.status === 429) {
                return res.status(429).json(error(
                    'Rate limit exceeded for AI service',
                    ErrorTypes.RATE_LIMIT,
                    429
                ));
            }

            res.status(500).json(error(
                'Failed to process chat request',
                ErrorTypes.INTERNAL,
                500,
                err
            ));
        }
    });

    // Chat history endpoint
    router.get('/history', chatLimiter, async (req, res) => {
        try {
            const { walletAddress } = req.query;
            
            if (!walletAddress) {
                return res.status(400).json(error(
                    'Wallet address is required',
                    ErrorTypes.VALIDATION,
                    400
                ));
            }

            // In a real implementation, you would fetch chat history from a database
            // For now, we'll return an empty array as we haven't implemented storage yet
            res.json(success([]));
        } catch (err) {
            logger.error('Failed to get chat history', {
                component: 'chat',
                error: err.message
            });
            res.status(500).json(error(
                'Failed to get chat history',
                ErrorTypes.INTERNAL,
                500,
                err
            ));
        }
    });

    return router;
};
