import express from 'express';
import CryptoService from '../../../services/CryptoService.js';
import logger from '../../../utils/logger/index.js';
import { success, error, ErrorTypes } from '../../../utils/response/index.js';

const router = express.Router();

export default (blockchain) => {
    // Create new wallet
    router.post('/wallet', async (req, res) => {
        try {
            const address = await CryptoService.generateKeyPair();
            if (!address) {
                throw new Error('Failed to generate wallet address');
            }

            const wallet = {
                address,
                balance: 1000,
                createdAt: Date.now()
            };

            const result = await blockchain.addWallet(wallet);
            if (!result) {
                const errorDetails = {
                    component: 'registration',
                    operation: 'create_wallet',
                    timestamp: new Date().toISOString()
                };
                logger.error('Failed to create wallet', errorDetails);
                return res.status(500).json(error(
                    'Failed to create wallet',
                    ErrorTypes.INTERNAL,
                    500,
                    errorDetails
                ));
            }
            
            const metadata = {
                address: wallet.address,
                createdAt: wallet.createdAt,
                initialBalance: wallet.balance
            };
            logger.info('New wallet created', metadata);
            
            return res.status(201).json(success(
                result,
                'Wallet created successfully',
                201,
                metadata
            ));
        } catch (err) {
            const errorDetails = {
                component: 'registration',
                operation: 'create_wallet',
                error: err.message,
                timestamp: new Date().toISOString()
            };
            logger.error('Failed to create wallet', errorDetails);
            return res.status(500).json(error(
                'Failed to create wallet',
                ErrorTypes.INTERNAL,
                500,
                errorDetails,
                err
            ));
        }
    });

    // Get all wallets
    router.get('/wallets', async (req, res) => {
        try {
            const wallets = await blockchain.getAllWallets();
            const metadata = {
                count: wallets?.length || 0,
                timestamp: new Date().toISOString()
            };
            logger.info('Retrieved all wallets', metadata);
            return res.json(success(wallets || [], 'Wallets retrieved successfully', 200, metadata));
        } catch (err) {
            const errorDetails = {
                component: 'registration',
                operation: 'get_all_wallets',
                error: err.message,
                timestamp: new Date().toISOString()
            };
            logger.error('Failed to retrieve wallets', errorDetails);
            return res.status(500).json(error(
                'Failed to retrieve wallets',
                ErrorTypes.INTERNAL,
                500,
                errorDetails,
                err
            ));
        }
    });

    // Get wallet by address
    router.get('/:address', async (req, res) => {
        const { address } = req.params;
        logger.info('Retrieving wallet info');

        try {
            const wallet = await blockchain.getWallet(address);
            if (!wallet) {
                return res.status(404).json(error(
                    'Wallet not found',
                    ErrorTypes.NOT_FOUND,
                    404,
                    { address }
                ));
            }

            const isMainWallet = address === 'main_wallet';
            const transactions = await blockchain.getWalletTransactionCount(address);
            const metadata = {
                isMainWallet,
                transactionCount: transactions,
                lastUpdated: new Date().toISOString()
            };

            return res.json(success(
                { ...wallet, isMainWallet, transactions },
                'Wallet details retrieved successfully',
                200,
                metadata
            ));
        } catch (err) {
            const errorDetails = {
                component: 'registration',
                operation: 'get_wallet',
                error: err.message,
                address,
                timestamp: new Date().toISOString()
            };
            logger.error('Failed to retrieve wallet info', errorDetails);
            return res.status(500).json(error(
                'Failed to retrieve wallet information',
                ErrorTypes.INTERNAL,
                500,
                errorDetails,
                err
            ));
        }
    });

    // Delete wallet (admin only)
    router.delete('/:address', async (req, res) => {
        const { address } = req.params;
        const { isAdmin } = req.body;

        if (!isAdmin) {
            logger.error('Unauthorized wallet deletion attempt', {
                component: 'registration',
                address,
                error: 'Admin privileges required',
                code: 403
            });
            return res.status(403).json(error(
                'Admin privileges required',
                ErrorTypes.FORBIDDEN,
                403
            ));
        }

        if (address === 'main_wallet') {
            logger.error('Invalid wallet deletion attempt', {
                component: 'registration',
                address,
                error: 'Cannot delete main wallet',
                code: 400
            });
            return res.status(400).json(error(
                'Cannot delete main wallet',
                ErrorTypes.VALIDATION,
                400
            ));
        }

        try {
            const exists = await blockchain.hasWallet(address);
            if (!exists) {
                logger.error('Wallet not found', {
                    component: 'registration',
                    address,
                    error: 'Wallet not found',
                    code: 404
                });
                return res.status(404).json(error(
                    'Wallet not found',
                    ErrorTypes.NOT_FOUND,
                    404
                ));
            }

            const walletInfo = await blockchain.getWallet(address);
            await blockchain.removeWallet(address);
            
            const metadata = {
                deletedAddress: address,
                balanceTransferred: walletInfo?.balance || 0,
                timestamp: new Date().toISOString()
            };
            
            logger.info('Wallet deleted successfully', metadata);
            return res.json(success(
                null,
                'Wallet deleted successfully. Balance transferred to main wallet.',
                200,
                metadata
            ));
        } catch (err) {
            const errorDetails = {
                component: 'registration',
                operation: 'delete_wallet',
                error: err.message,
                address,
                timestamp: new Date().toISOString()
            };
            logger.error('Failed to delete wallet', errorDetails);
            return res.status(500).json(error(
                'Failed to delete wallet',
                ErrorTypes.INTERNAL,
                500,
                errorDetails,
                err
            ));
        }
    });

    return router;
};
