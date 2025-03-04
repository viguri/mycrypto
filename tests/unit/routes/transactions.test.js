import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import transactionRoutes from '../../../src/api/routes/transactions/index.js';

describe('Transaction Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Create mock blockchain
    mockBlockchain = {
      pendingTransactions: [],
      chain: [],
      createTransaction: jest.fn(),
      hasWallet: jest.fn()
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/transactions', transactionRoutes(mockBlockchain));

    // Add error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        error: err.name || 'InternalError',
        message: err.message || 'An unexpected error occurred'
      });
    });
  });

  describe('POST /', () => {
    const validTransaction = {
      from: '6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7',
      to: '107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3',
      amount: 50
    };

    it('should create a new transaction successfully', async () => {
      // Setup mock response
      const mockTxResponse = {
        hash: 'test-hash',
        ...validTransaction,
        timestamp: Date.now()
      };
      mockBlockchain.createTransaction.mockResolvedValue(mockTxResponse);

      // Make request
      const response = await request(app)
        .post('/api/transactions')
        .send(validTransaction)
        .expect(201);

      // Assertions
      expect(response.body).toEqual({
        message: 'Transaction created successfully',
        transaction: mockTxResponse
      });
      expect(mockBlockchain.createTransaction).toHaveBeenCalledWith({
        from: validTransaction.from,
        to: validTransaction.to,
        amount: validTransaction.amount
      });
    });

    it('should return 400 for missing transaction data', async () => {
      const invalidTransactions = [
        { to: validTransaction.to, amount: validTransaction.amount }, // missing from
        { from: validTransaction.from, amount: validTransaction.amount }, // missing to
        { from: validTransaction.from, to: validTransaction.to }, // missing amount
      ];

      for (const invalidTx of invalidTransactions) {
        const response = await request(app)
          .post('/api/transactions')
          .send(invalidTx)
          .expect(400);

        expect(response.body).toEqual({
          error: 'ValidationError',
          message: 'Missing required fields'
        });
      }
    });

    it('should handle blockchain errors', async () => {
      const error = new Error('Insufficient balance');
      error.name = 'TransactionError';
      mockBlockchain.createTransaction.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/transactions')
        .send(validTransaction)
        .expect(500);

      expect(response.body).toEqual({
        error: 'TransactionError',
        message: 'Insufficient balance'
      });
    });
  });

  describe('GET /pending', () => {
    it('should return pending transactions', async () => {
      // Setup mock data
      const mockPendingTx = [
        {
          hash: 'tx1',
          from: 'wallet1',
          to: 'wallet2',
          amount: 100,
          timestamp: Date.now()
        }
      ];
      mockBlockchain.pendingTransactions = mockPendingTx;

      // Make request
      const response = await request(app)
        .get('/api/transactions/pending')
        .expect(200);

      // Assertions
      expect(response.body).toEqual({
        message: 'Pending transactions retrieved',
        transactions: mockPendingTx
      });
    });

    it('should handle errors when fetching pending transactions', async () => {
      // Force error by setting pendingTransactions to null
      const error = new Error('Failed to get pending transactions');
      error.name = 'TransactionError';
      Object.defineProperty(mockBlockchain, 'pendingTransactions', {
        get: () => { throw error; }
      });

      const response = await request(app)
        .get('/api/transactions/pending')
        .expect(500);

      expect(response.body).toEqual({
        error: 'TransactionError',
        message: 'Failed to get pending transactions'
      });
    });
  });

  describe('GET /wallet/:address', () => {
    const testWallet = '6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7';

    beforeEach(() => {
      mockBlockchain.hasWallet.mockReturnValue(true);
      // Setup mock data
      mockBlockchain.pendingTransactions = [
        {
          hash: 'pending1',
          from: testWallet,
          to: 'other-wallet',
          amount: 50,
          timestamp: Date.now()
        }
      ];
      mockBlockchain.chain = [
        {
          transactions: [
            {
              hash: 'confirmed1',
              from: 'other-wallet',
              to: testWallet,
              amount: 100,
              timestamp: Date.now() - 1000,
              blockHash: 'block1'
            }
          ]
        }
      ];
    });

    it('should return all transactions for a wallet', async () => {
      const response = await request(app)
        .get(`/api/transactions/wallet/${testWallet}`)
        .expect(200);

      expect(response.body).toEqual({
        message: 'Wallet transactions retrieved',
        transactions: expect.arrayContaining([
          expect.objectContaining({ hash: 'pending1' }),
          expect.objectContaining({ hash: 'confirmed1' })
        ])
      });
      expect(response.body.transactions).toHaveLength(2);
    });

    it('should return 404 for non-existent wallet', async () => {
      mockBlockchain.hasWallet.mockReturnValue(false);

      const response = await request(app)
        .get('/api/transactions/wallet/non-existent')
        .expect(404);

      expect(response.body).toEqual({
        error: 'NotFound',
        message: 'Wallet not found'
      });
    });
  });

  describe('GET /:hash', () => {
    const testHash = 'test-transaction-hash';

    it('should return pending transaction by hash', async () => {
      // Setup mock pending transaction
      mockBlockchain.pendingTransactions = [
        {
          hash: testHash,
          from: 'wallet1',
          to: 'wallet2',
          amount: 50,
          timestamp: Date.now()
        }
      ];

      const response = await request(app)
        .get(`/api/transactions/${testHash}`)
        .expect(200);

      expect(response.body).toHaveProperty('hash', testHash);
    });

    it('should return confirmed transaction by hash', async () => {
      // Setup mock confirmed transaction in blockchain
      mockBlockchain.chain = [
        {
          transactions: [
            {
              hash: testHash,
              from: 'wallet1',
              to: 'wallet2',
              amount: 50,
              timestamp: Date.now(),
              blockHash: 'block1'
            }
          ]
        }
      ];

      const response = await request(app)
        .get(`/api/transactions/${testHash}`)
        .expect(200);

      expect(response.body).toHaveProperty('hash', testHash);
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/non-existent-hash')
        .expect(404);

      expect(response.body).toEqual({
        error: 'NotFound',
        message: 'Transaction not found'
      });
    });
  });
});