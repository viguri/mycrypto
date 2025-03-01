const request = require('supertest');
const express = require('express');
const transactionRoutes = require('../../../src/api/routes/transactions');

// Mock the logger to avoid logging during tests
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

describe('Transaction Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Create mock blockchain
    mockBlockchain = {
      pendingTransactions: [],
      chain: [],
      addTransaction: jest.fn()
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/transactions', transactionRoutes(mockBlockchain));
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
      mockBlockchain.addTransaction.mockResolvedValue(mockTxResponse);

      // Make request
      const response = await request(app)
        .post('/api/transactions')
        .send(validTransaction)
        .expect(201);

      // Assertions
      expect(response.body).toHaveProperty('message', 'Transaction created successfully');
      expect(response.body.transaction).toMatchObject({
        hash: 'test-hash',
        from: validTransaction.from,
        to: validTransaction.to,
        amount: validTransaction.amount
      });
      expect(mockBlockchain.addTransaction).toHaveBeenCalledWith(
        validTransaction.from,
        validTransaction.to,
        validTransaction.amount
      );
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

        expect(response.body).toHaveProperty('error', 'TransactionError');
        expect(response.body).toHaveProperty('message', 'Missing required transaction data');
      }
    });

    it('should handle blockchain errors', async () => {
      mockBlockchain.addTransaction.mockRejectedValue(new Error('Insufficient balance'));

      const response = await request(app)
        .post('/api/transactions')
        .send(validTransaction)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'TransactionError');
      expect(response.body).toHaveProperty('message', 'Insufficient balance');
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
      expect(response.body).toHaveProperty('count', 1);
      expect(response.body.transactions).toHaveLength(1);
      expect(response.body.transactions[0]).toMatchObject({
        hash: 'tx1',
        from: 'wallet1',
        to: 'wallet2',
        amount: 100
      });
    });

    it('should handle errors when fetching pending transactions', async () => {
      // Force error by setting pendingTransactions to null
      mockBlockchain.pendingTransactions = null;

      const response = await request(app)
        .get('/api/transactions/pending')
        .expect(500);

      expect(response.body).toHaveProperty('error', 'TransactionError');
      expect(response.body).toHaveProperty('message', 'Failed to get pending transactions');
    });
  });

  describe('GET /wallet/:address', () => {
    const testWallet = '6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7';

    beforeEach(() => {
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

      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toMatchObject({
        hash: 'pending1',
        status: 'pending'
      });
      expect(response.body[1]).toMatchObject({
        hash: 'confirmed1',
        status: 'confirmed'
      });
    });

    it('should return empty array for wallet with no transactions', async () => {
      const response = await request(app)
        .get('/api/transactions/wallet/empty-wallet')
        .expect(200);

      expect(response.body).toHaveLength(0);
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

      expect(response.body).toMatchObject({
        hash: testHash,
        status: 'pending'
      });
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

      expect(response.body).toMatchObject({
        hash: testHash,
        status: 'confirmed'
      });
    });

    it('should return 404 for non-existent transaction', async () => {
      const response = await request(app)
        .get('/api/transactions/non-existent-hash')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'NotFound');
      expect(response.body).toHaveProperty('message', 'Transaction not found');
    });
  });
});