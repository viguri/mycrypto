import express from 'express';
import rateLimit from 'express-rate-limit';
import { validateRequest } from '../../../middleware/validation.js';
import logger from '../../../utils/logger/index.js';

const router = express.Router();

// Rate limiter for wallet endpoints
const walletLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: 'TooManyRequests',
        message: 'Too many wallet requests, please try again later'
    }
});

// Validate Ethereum address
const validateAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Connect wallet endpoint
router.post('/connect', walletLimiter, validateRequest, async (req, res) => {
    try {
        const { address } = req.body;

        // Validate address format
        if (!validateAddress(address)) {
            logger.warn('Invalid wallet address format', {
                component: 'wallet',
                address,
                ip: req.ip
            });
            return res.status(400).json({
                error: 'InvalidAddress',
                message: 'Invalid Ethereum address format'
            });
        }

        // Log successful connection
        logger.info('Wallet connected', {
            component: 'wallet',
            address,
            ip: req.ip
        });

        // Set secure session cookie
        req.session.wallet = {
            address,
            connectedAt: new Date().toISOString()
        };

        res.json({
            status: 'connected',
            address
        });
    } catch (error) {
        logger.error('Wallet connection error', {
            component: 'wallet',
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            error: 'ConnectionError',
            message: 'Failed to connect wallet'
        });
    }
});

// Get wallet status
router.get('/status', walletLimiter, async (req, res) => {
    try {
        const wallet = req.session.wallet;

        if (!wallet) {
            return res.json({
                status: 'disconnected'
            });
        }

        res.json({
            status: 'connected',
            address: wallet.address,
            connectedAt: wallet.connectedAt
        });
    } catch (error) {
        logger.error('Wallet status error', {
            component: 'wallet',
            error: error.message
        });

        res.status(500).json({
            error: 'StatusError',
            message: 'Failed to get wallet status'
        });
    }
});

// Disconnect wallet
router.post('/disconnect', walletLimiter, async (req, res) => {
    try {
        // Log disconnection
        if (req.session.wallet) {
            logger.info('Wallet disconnected', {
                component: 'wallet',
                address: req.session.wallet.address
            });
        }

        // Clear session
        req.session.destroy();

        res.json({
            status: 'disconnected'
        });
    } catch (error) {
        logger.error('Wallet disconnection error', {
            component: 'wallet',
            error: error.message
        });

        res.status(500).json({
            error: 'DisconnectionError',
            message: 'Failed to disconnect wallet'
        });
    }
});

export default router;
