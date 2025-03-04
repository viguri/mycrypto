import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import blockchainRoutes from '../../../src/api/routes/blockchain/index.js';

describe('Blockchain Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Create mock blockchain with all required methods
    mockBlockchain = {
      chain: [],
      pendingTransactions: [],
      getWalletCount: jest.fn().mockReturnValue(0),
      getLatestBlock: jest.fn(),
      difficulty: 4
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/blockchain', blockchainRoutes(mockBlockchain));

    // Add error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        error: err.name || 'InternalError',
        message: err.message || 'An unexpected error occurred'
      });
    });
  });

  describe('GET /', () => {
    it('should return the full blockchain', async () => {
      // Setup mock data
      const mockChain = [
        { hash: 'hash1', data: 'block1' },
        { hash: 'hash2', data: 'block2' }
      ];
      const mockPendingTx = [
        { hash: 'tx1', amount: 100 }
      ];
      mockBlockchain.chain = mockChain;
      mockBlockchain.pendingTransactions = mockPendingTx;

      // Make request
      const response = await request(app)
        .get('/api/blockchain')
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('chain');
      expect(response.body).toHaveProperty('pendingTransactions');
      expect(response.body).toHaveProperty('stats');
      expect(response.body.chain).toEqual(mockChain);
      expect(response.body.pendingTransactions).toEqual(mockPendingTx);
      expect(response.body.stats).toEqual({
        blockCount: mockChain.length,
        pendingCount: mockPendingTx.length,
        walletCount: 0
      });
    });

    it('should handle errors when getting blockchain', async () => {
      // Setup mock to throw error
      const error = new Error('Failed to get blockchain');
      error.name = 'BlockchainError';
      Object.defineProperty(mockBlockchain, 'chain', {
        get: () => { throw error; }
      });

      // Make request
      const response = await request(app)
        .get('/api/blockchain')
        .expect(500);

      // Assertions
      expect(response.body).toEqual({
        error: 'BlockchainError',
        message: 'Failed to get blockchain'
      });
    });
  });

  describe('GET /block/:index', () => {
    it('should return a specific block by index', async () => {
      // Setup mock data
      const mockBlock = {
        hash: 'test-hash',
        data: 'block-data',
        timestamp: Date.now(),
        transactions: []
      };
      mockBlockchain.chain = [mockBlock];

      // Make request
      const response = await request(app)
        .get('/api/blockchain/block/0')
        .expect(200);

      // Assertions
      expect(response.body).toEqual(mockBlock);
    });

    it('should return 404 for non-existent block', async () => {
      // Setup mock with empty chain
      mockBlockchain.chain = [];

      // Make request
      const response = await request(app)
        .get('/api/blockchain/block/0')
        .expect(404);

      // Assertions
      expect(response.body).toEqual({
        error: 'NotFound',
        message: 'Block not found'
      });
    });

    it('should return 400 for invalid index', async () => {
      // Make request with invalid index
      const response = await request(app)
        .get('/api/blockchain/block/invalid')
        .expect(400);

      // Assertions
      expect(response.body).toEqual({
        error: 'InvalidIndex',
        message: 'Invalid block index'
      });
    });
  });

  describe('GET /stats', () => {
    it('should return blockchain statistics', async () => {
      // Setup mock data
      const mockChain = [{ hash: 'latest-hash', data: 'block' }];
      mockBlockchain.chain = mockChain;
      mockBlockchain.pendingTransactions = [];
      mockBlockchain.getLatestBlock.mockReturnValue({ hash: 'latest-hash' });

      // Make request
      const response = await request(app)
        .get('/api/blockchain/stats')
        .expect(200);

      // Assertions
      expect(response.body).toEqual({
        blockCount: 1,
        pendingTransactions: 0,
        walletCount: 0,
        lastBlockHash: 'latest-hash',
        difficulty: 4
      });
    });

    it('should handle errors when getting blockchain stats', async () => {
      // Setup mock to throw error
      const error = new Error('Failed to get blockchain stats');
      error.name = 'BlockchainError';
      mockBlockchain.getLatestBlock.mockImplementation(() => {
        throw error;
      });

      // Make request
      const response = await request(app)
        .get('/api/blockchain/stats')
        .expect(500);

      // Assertions
      expect(response.body).toEqual({
        error: 'BlockchainError',
        message: 'Failed to get blockchain stats'
      });
    });
  });
});