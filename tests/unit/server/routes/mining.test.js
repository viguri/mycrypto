import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';
import miningRoutes from '../../../src/api/routes/mining/index.js';

describe('Mining Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Create mock blockchain
    mockBlockchain = {
      pendingTransactions: [],
      chain: [],
      difficulty: 4,
      mineBlock: jest.fn(),
      getLatestBlock: jest.fn()
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/mining', miningRoutes(mockBlockchain));

    // Add error handling middleware
    app.use((err, req, res, next) => {
      res.status(500).json({
        error: err.name || 'InternalError',
        message: err.message || 'An unexpected error occurred'
      });
    });
  });

  describe('POST /mine', () => {
    it('should mine a new block when there are pending transactions', async () => {
      // Setup mock data
      const mockBlock = {
        hash: 'test-block-hash',
        index: 1,
        previousHash: 'prev-hash',
        timestamp: Date.now(),
        transactions: [
          {
            hash: 'tx1',
            from: 'wallet1',
            to: 'wallet2',
            amount: 50
          }
        ],
        nonce: 12345
      };

      mockBlockchain.pendingTransactions = [mockBlock.transactions[0]];
      mockBlockchain.mineBlock.mockResolvedValue(mockBlock);

      // Make request
      const response = await request(app)
        .post('/api/mining/mine')
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('message', 'Block mined successfully');
      expect(response.body.block).toMatchObject({
        hash: mockBlock.hash,
        index: mockBlock.index,
        transactionCount: mockBlock.transactions.length,
        nonce: mockBlock.nonce
      });
      expect(mockBlockchain.mineBlock).toHaveBeenCalled();
    });

    it('should return 400 when there are no pending transactions', async () => {
      // Setup empty pending transactions
      mockBlockchain.pendingTransactions = [];

      // Make request
      const response = await request(app)
        .post('/api/mining/mine')
        .expect(400);

      // Assertions
      expect(response.body).toEqual({
        error: 'MiningError',
        message: 'No transactions to mine'
      });
      expect(mockBlockchain.mineBlock).not.toHaveBeenCalled();
    });

    it('should handle mining errors', async () => {
      // Setup mock data with error
      mockBlockchain.pendingTransactions = [{ hash: 'tx1' }];
      const error = new Error('Mining failed');
      error.name = 'MiningError';
      mockBlockchain.mineBlock.mockRejectedValue(error);

      // Make request
      const response = await request(app)
        .post('/api/mining/mine')
        .expect(500);

      expect(response.body).toEqual({
        error: 'MiningError',
        message: 'Mining failed'
      });
    });
  });

  describe('GET /stats', () => {
    it('should return current mining stats', async () => {
      // Setup mock data
      const mockLatestBlock = { hash: 'latest-block-hash' };
      mockBlockchain.pendingTransactions = [{ hash: 'tx1' }];
      mockBlockchain.difficulty = 4;
      mockBlockchain.chain = [mockLatestBlock];
      mockBlockchain.getLatestBlock.mockReturnValue(mockLatestBlock);

      // Make request
      const response = await request(app)
        .get('/api/mining/stats')
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('message', 'Mining stats retrieved');
      expect(response.body.stats).toMatchObject({
        pendingTransactions: 1,
        difficulty: 4,
        lastBlockHash: 'latest-block-hash',
        totalBlocks: 1
      });
      expect(mockBlockchain.getLatestBlock).toHaveBeenCalled();
    });

    it('should handle errors when getting mining stats', async () => {
      // Setup mock to throw error
      const error = new Error('Failed to get mining status');
      error.name = 'MiningError';
      mockBlockchain.getLatestBlock.mockImplementation(() => {
        throw error;
      });

      // Make request
      const response = await request(app)
        .get('/api/mining/stats')
        .expect(500);

      expect(response.body).toEqual({
        error: 'MiningError',
        message: 'Failed to get mining status'
      });
    });
  });
});