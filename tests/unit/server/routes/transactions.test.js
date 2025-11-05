import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import transactionRoutes from '@/api/routes/transactions/index.js';
import { success, error, ErrorTypes } from '@/utils/response/index.js';

describe('Transaction Routes', () => {
    let app;
    let mockBlockchain;

    beforeEach(() => {
        mockBlockchain = {
            createTransaction: jest.fn(),
            pendingTransactions: [],
            getWallet: jest.fn(),
            hasWallet: jest.fn(),
            chain: []
        };

        app = express();
        app.use(express.json());
        app.use('/api/transactions', transactionRoutes(mockBlockchain));

        app.use((err, req, res, next) => {
            res.status(500).json(error(
                err.message || 'An unexpected error occurred',
                'InternalError',
                500
            ));
        });
    });

    describe('POST /', () => {
        it('should create a new transaction', async () => {
            const mockTransaction = {
                hash: 'test-hash',
                from: 'sender',
                to: 'recipient',
                amount: 100
            };

            mockBlockchain.createTransaction.mockResolvedValue(mockTransaction);
            mockBlockchain.hasWallet.mockReturnValue(true);

            const response = await request(app)
                .post('/api/transactions')
                .send({
                    from: 'sender',
                    to: 'recipient',
                    amount: 100
                })
                .expect(201);

            expect(response.body).toEqual(success(mockTransaction, 'Transaction created successfully', 201));
        });

        it('should return 400 for missing fields', async () => {
            const response = await request(app)
                .post('/api/transactions')
                .send({})
                .expect(400);

            expect(response.body).toEqual(error(
                'Missing required fields',
                ErrorTypes.VALIDATION,
                400
            ));
        });
    });

    describe('GET /pending', () => {
        it('should return pending transactions', async () => {
            mockBlockchain.pendingTransactions = [
                { hash: 'tx1' },
                { hash: 'tx2' }
            ];

            const response = await request(app)
                .get('/api/transactions/pending')
                .expect(200);

            expect(response.body).toEqual(success(mockBlockchain.pendingTransactions, 'Pending transactions retrieved'));
        });
    });

    describe('GET /:hash', () => {
        it('should return transaction by hash', async () => {
            const mockTransaction = { hash: 'test-hash' };
            mockBlockchain.pendingTransactions = [mockTransaction];

            const response = await request(app)
                .get('/api/transactions/test-hash')
                .expect(200);

            expect(response.body).toEqual(success(mockTransaction));
        });

        it('should return 404 for non-existent transaction', async () => {
            const response = await request(app)
                .get('/api/transactions/non-existent')
                .expect(404);

            expect(response.body).toEqual(error(
                'Transaction not found',
                ErrorTypes.NOT_FOUND,
                404
            ));
        });
    });

    describe('GET /wallet/:address', () => {
        it('should return wallet transactions', async () => {
            mockBlockchain.hasWallet.mockReturnValue(true);
            const mockTransactions = [
                { from: 'test-address', hash: 'tx1' },
                { to: 'test-address', hash: 'tx2' }
            ];
            mockBlockchain.chain = [
                { transactions: mockTransactions }
            ];
            mockBlockchain.pendingTransactions = [];

            const response = await request(app)
                .get('/api/transactions/wallet/test-address')
                .expect(200);

            expect(response.body).toEqual(success(mockTransactions, 'Wallet transactions retrieved'));
        });

        it('should return 404 for non-existent wallet', async () => {
            mockBlockchain.hasWallet.mockReturnValue(false);

            const response = await request(app)
                .get('/api/transactions/wallet/non-existent')
                .expect(404);

            expect(response.body).toEqual(error(
                'Wallet not found',
                ErrorTypes.NOT_FOUND,
                404
            ));
        });
    });
});