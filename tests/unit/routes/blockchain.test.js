const request = require('supertest');
const express = require('express');
const blockchainRoutes = require('../../../src/api/routes/blockchain');

// Mock the logger to avoid logging during tests
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  warn: jest.fn()
}));

describe('Blockchain Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Create mock blockchain
    mockBlockchain = {
      chain: [],
      pendingTransactions: [],
      getBlock: jest.fn(),
      getLatestBlock: jest.fn(),
      isChainValid: jest.fn()
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/blockchain', blockchainRoutes(mockBlockchain));
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
      expect(response.body.chain).toEqual(mockChain);
      expect(response.body.pendingTransactions).toEqual(mockPendingTx);
    });
  });

  describe('GET /:hash', () => {
    it('should return a specific block by hash', async () => {
      // Setup mock data
      const mockBlock = {
        hash: 'test-hash',
        data: 'block-data',
        timestamp: Date.now()
      };
      mockBlockchain.getBlock.mockReturnValue(mockBlock);

      // Make request
      const response = await request(app)
        .get('/api/blockchain/test-hash')
        .expect(200);

      // Assertions
      expect(response.body).toEqual(mockBlock);
      expect(mockBlockchain.getBlock).toHaveBeenCalledWith('test-hash');
    });

    it('should return 404 for non-existent block', async () => {
      // Setup mock to return null for non-existent block
      mockBlockchain.getBlock.mockReturnValue(null);

      // Make request
      const response = await request(app)
        .get('/api/blockchain/non-existent-hash')
        .expect(404);

      // Assertions
      expect(response.body).toHaveProperty('error', 'BlockNotFound');
      expect(response.body).toHaveProperty('message', 'Block with specified hash not found');
    });
  });
});