import express from 'express';
import logger from '../../../utils/logger/index.js';
import CryptoService from '../../../services/CryptoService.js';

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const registrationRoutes = (blockchain) => {
    const router = express.Router();

    // Create new wallet
    router.post('/wallet', asyncHandler(async (req, res) => {
        try {
            // Generate new wallet address
            const address = await CryptoService.generateKeyPair();

            // Initialize wallet with starting balance
            const wallet = {
                address,
                balance: 1000,  // Initial balance for testing
                createdAt: Date.now()
            };

            await blockchain.addWallet(wallet);

            logger.info('New wallet created', {
                component: 'registration',
                address: address.substring(0, 8) + '...',
                balance: wallet.balance
            });

            res.status(201).json({
                success: true,
                data: {
                    address: wallet.address,
                    balance: wallet.balance,
                    createdAt: wallet.createdAt
                },
                wallet: {
                    address: wallet.address,
                    balance: wallet.balance,
                    createdAt: wallet.createdAt
                }
            });
        } catch (error) {
            logger.error('Failed to create wallet', {
                component: 'registration',
                error: error.message
            });
            throw error;
        }
    }));

    // Get all wallets
    router.get('/wallets', asyncHandler(async (req, res) => {
        try {
            const wallets = blockchain.getAllWallets();
            
            logger.info('Retrieved all wallets', {
                component: 'registration',
                count: wallets.length
            });

            res.json({
                message: 'Wallets retrieved successfully',
                wallets: wallets.map(wallet => ({
                    address: wallet.address,
                    balance: wallet.balance,
                    createdAt: wallet.createdAt,
                    isMainWallet: wallet.isMainWallet || false
                }))
            });
        } catch (error) {
            logger.error('Failed to get wallets', {
                component: 'registration',
                error: error.message
            });
            throw error;
        }
    }));

    // Get wallet by address
    router.get('/:address', asyncHandler(async (req, res) => {
        const { address } = req.params;

        try {
            logger.info('Retrieving wallet info', {
                component: 'registration',
                address: address.substring(0, 8) + '...'
            });

            const wallet = blockchain.getWallet(address);
            if (!wallet) {
                return res.status(404).json({
                    error: 'NotFound',
                    message: 'Wallet not found'
                });
            }

            logger.info('Wallet info retrieved', {
                component: 'registration',
                address: address.substring(0, 8) + '...',
                balance: wallet.balance
            });

            res.json({
                address: wallet.address,
                balance: wallet.balance,
                createdAt: wallet.createdAt,
                isMainWallet: wallet.isMainWallet || false,
                transactions: blockchain.getWalletTransactionCount(address)
            });
        } catch (error) {
            logger.error('Failed to get wallet', {
                component: 'registration',
                error: error.message,
                address: address?.substring(0, 8) + '...'
            });
            throw error;
        }
    }));

    // Delete wallet (admin only)
    router.delete('/:address', asyncHandler(async (req, res) => {
        const { address } = req.params;
        const { isAdmin } = req.body;

        try {
            if (!isAdmin) {
                return res.status(403).json({
                    error: 'Forbidden',
                    message: 'Admin privileges required'
                });
            }

            if (!blockchain.hasWallet(address)) {
                return res.status(404).json({
                    error: 'NotFound',
                    message: 'Wallet not found'
                });
            }

            if (address === 'main_wallet') {
                return res.status(400).json({
                    error: 'InvalidOperation',
                    message: 'Cannot delete main wallet'
                });
            }

            logger.info('Deleting wallet', {
                component: 'registration',
                address: address.substring(0, 8) + '...'
            });

            await blockchain.removeWallet(address);

            logger.info('Wallet deleted', {
                component: 'registration',
                address: address.substring(0, 8) + '...'
            });

            res.json({
                message: 'Wallet deleted successfully'
            });
        } catch (error) {
            logger.error('Failed to delete wallet', {
                component: 'registration',
                error: error.message,
                address: address?.substring(0, 8) + '...'
            });
            throw error;
        }
    }));

    return router;
};

export default registrationRoutes;