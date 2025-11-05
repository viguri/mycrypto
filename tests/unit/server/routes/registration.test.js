import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import registrationRoutes from '@/api/routes/registration/index.js';
import { success, error, ErrorTypes } from '@/utils/response/index.js';
import mockLogger, { mockLogs } from '../../mocks/logger.js';
import { MOCK_ADDRESS } from '@/services/__mocks__/CryptoService.js';
import { mockWallet } from '../../mocks/mockData.js';

describe('Registration Routes', () => {
    let app;
    let mockBlockchain;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();
        mockLogger.reset();
        
        // Setup blockchain mock
        mockBlockchain = {
            addWallet: jest.fn().mockImplementation(async (wallet) => mockWallet),
            getWallet: jest.fn().mockImplementation(async (address) => {
                if (address === 'main_wallet' || address === MOCK_ADDRESS) {
                    return mockWallet;
                }
                return null;
            }),
            getAllWallets: jest.fn().mockResolvedValue([mockWallet]),
            hasWallet: jest.fn().mockImplementation(async (address) => {
                if (address === 'main_wallet' || address === MOCK_ADDRESS) {
                    return true;
                }
                return false;
            }),
            removeWallet: jest.fn().mockImplementation(async (address) => {
                if (address === MOCK_ADDRESS) {
                    return true;
                }
                return false;
            }),
            getWalletTransactionCount: jest.fn().mockResolvedValue(5)
        };

        // Mock Date.now
        jest.spyOn(Date, 'now').mockReturnValue(1741125472631);

        // Setup express app
        app = express();
        app.use(express.json());
        app.use('/api/registration', registrationRoutes(mockBlockchain));
    });

    describe('POST /wallet', () => {
        it('should create a new wallet', async () => {
            const response = await request(app)
                .post('/api/registration/wallet');

            expect(response.status).toBe(201);
            expect(response.body).toEqual(success(mockWallet, 'Wallet created successfully', 201));
            expect(mockBlockchain.addWallet).toHaveBeenCalledWith({
                address: expect.any(String),
                balance: 1000,
                createdAt: expect.any(Number)
            });
        });

        it('should handle wallet creation errors', async () => {
            // Mock the blockchain to throw an error
            mockBlockchain.addWallet.mockRejectedValueOnce(new Error('Failed to create wallet'));

            const response = await request(app)
                .post('/api/registration/wallet');

            expect(response.status).toBe(500);
            expect(response.body).toEqual(error(
                'Failed to create wallet',
                ErrorTypes.INTERNAL,
                500
            ));
            expect(mockLogger.error).toHaveBeenCalledWith('Failed to create wallet', expect.objectContaining({
                component: 'registration',
                error: 'Failed to create wallet'
            }));
        });
    });

    describe('GET /wallets', () => {
        it('should return all wallets', async () => {
            const response = await request(app)
                .get('/api/registration/wallets');

            expect(response.status).toBe(200);
            expect(response.body).toEqual(success([mockWallet], 'Wallets retrieved successfully'));
            expect(mockBlockchain.getAllWallets).toHaveBeenCalled();
            expect(mockLogger.info).toHaveBeenCalledWith('Retrieved all wallets');
        });
    });

    describe('GET /:address', () => {
        it('should return wallet by address', async () => {
            const expectedWallet = {
                ...mockWallet,
                isMainWallet: false,
                transactions: 5
            };

            const response = await request(app)
                .get(`/api/registration/${MOCK_ADDRESS}`);

            expect(response.status).toBe(200);
            expect(response.body).toEqual(success(expectedWallet));
            expect(mockBlockchain.getWallet).toHaveBeenCalledWith(MOCK_ADDRESS);
            expect(mockLogger.info).toHaveBeenCalledWith('Retrieving wallet info');
        });

        it('should return 404 for non-existent wallet', async () => {
            mockBlockchain.getWallet.mockResolvedValueOnce(null);

            const response = await request(app)
                .get('/api/registration/non-existent');

            expect(response.status).toBe(404);
            expect(response.body).toEqual(error(
                'Wallet not found',
                ErrorTypes.NOT_FOUND,
                404
            ));
        });
    });

    describe('DELETE /:address', () => {
        it('should delete wallet with admin privileges', async () => {
            const response = await request(app)
                .delete(`/api/registration/${MOCK_ADDRESS}`)
                .send({ isAdmin: true });

            expect(response.status).toBe(200);
            expect(response.body).toEqual(success(null, 'Wallet deleted successfully'));
            expect(mockBlockchain.removeWallet).toHaveBeenCalledWith(MOCK_ADDRESS);
            expect(mockLogger.info).toHaveBeenCalledWith('Wallet deleted successfully');
        });

        it('should return 403 without admin privileges', async () => {
            const response = await request(app)
                .delete(`/api/registration/${MOCK_ADDRESS}`)
                .send({ isAdmin: false });

            expect(response.status).toBe(403);
            expect(response.body).toEqual(error(
                'Admin privileges required',
                ErrorTypes.FORBIDDEN,
                403
            ));
        });

        it('should return 404 for non-existent wallet', async () => {
            mockBlockchain.hasWallet.mockResolvedValueOnce(false);

            const response = await request(app)
                .delete('/api/registration/non-existent')
                .send({ isAdmin: true });

            expect(response.status).toBe(404);
            expect(response.body).toEqual(error(
                'Wallet not found',
                ErrorTypes.NOT_FOUND,
                404
            ));
        });

        it('should prevent deleting main wallet', async () => {
            const response = await request(app)
                .delete('/api/registration/main_wallet')
                .send({ isAdmin: true });

            expect(response.status).toBe(400);
            expect(response.body).toEqual(error(
                'Cannot delete main wallet',
                ErrorTypes.VALIDATION,
                400
            ));
        });
    });
});