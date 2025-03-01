const express = require('express');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../utils/logger');
const CryptoService = require('../../services/CryptoService');

// Async handler wrapper
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const registrationRoutes = (blockchain) => {
    const router = express.Router();

    // Register new wallet
    router.post('/wallet', asyncHandler(async (req, res) => {
        try {
            logger.info('Processing wallet registration request', {
                component: 'registration'
            });

            // Generate unique wallet address based on timestamp and random data
            const addressSeed = uuidv4() + Date.now();
            const address = await CryptoService.hash(addressSeed);

            logger.info('Generated new wallet address', {
                component: 'registration',
                address: address.substring(0, 8) + '...'
            });

            // Create new wallet with initial balance
            const wallet = {
                address,
                balance: 1000, // Initial balance for testing
                createdAt: Date.now()
            };

            // Add wallet to blockchain
            blockchain.addWallet(wallet);
            
            logger.info('Wallet registered successfully', {
                component: 'registration',
                address: address.substring(0, 8) + '...',
                balance: wallet.balance
            });

            res.status(201).json({
                message: 'Wallet registered successfully',
                wallet: {
                    address,
                    balance: wallet.balance,
                    createdAt: wallet.createdAt
                }
            });

        } catch (error) {
            logger.error('Wallet registration failed', {
                component: 'registration',
                error: error.message,
                critical: true
            });
            
            res.status(500).json({
                error: 'RegistrationError',
                message: error.message || 'Failed to create wallet'
            });
        }
    }));

    // Get all wallets
    router.get('/wallets', asyncHandler(async (req, res) => {
        try {
            const wallets = blockchain.getAllWallets();
            if (!wallets || !Array.isArray(wallets)) {
                throw new Error('Failed to retrieve wallets');
            }

            logger.info('Retrieving all wallets', {
                component: 'registration',
                count: wallets.length
            });

            logger.info('Retrieved all wallets', {
                component: 'registration',
                count: wallets.length
            });

            res.json({
                wallets,
                count: wallets.length
            });

        } catch (error) {
            logger.error('Failed to retrieve wallets', {
                component: 'registration',
                error: error.message
            });

            res.status(500).json({
                error: 'RetrievalError',
                message: error.message || 'Failed to retrieve wallets'
            });
        }
    }));

    // Get wallet info
    router.get('/:address', asyncHandler(async (req, res) => {
        try {
            const { address } = req.params;

            logger.info('Retrieving wallet info', {
                component: 'registration',
                address: address.substring(0, 8) + '...'
            });

            const wallet = blockchain.getWallet(address);
            
            if (!wallet) {
                logger.warn('Wallet not found', {
                    component: 'registration',
                    address: address.substring(0, 8) + '...'
                });
                return res.status(404).json({
                    error: 'NotFound',
                    message: 'Wallet not found'
                });
            }

            const walletInfo = {
                address: wallet.address,
                balance: blockchain.getWalletBalance(address),
                transactionCount: blockchain.getWalletTransactionCount(address),
                createdAt: wallet.createdAt
            };

            logger.info('Wallet info retrieved', {
                component: 'registration',
                address: address.substring(0, 8) + '...',
                balance: walletInfo.balance
            });

            res.json(walletInfo);
        } catch (error) {
            logger.error('Failed to retrieve wallet info', {
                component: 'registration',
                error: error.message
            });

            res.status(400).json({
                error: 'RetrievalError',
                message: error.message || 'Failed to get wallet info'
            });
        }
    }));

    return router;
};

module.exports = registrationRoutes;