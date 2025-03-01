const request = require('supertest');
const express = require('express');
const createMiningRoutes = require('../../../src/api/routes/mining');

// Mock the logger to avoid logging during tests
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn()
}));

describe('Mining Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Create mock blockchain
    mockBlockchain = {
      pendingTransactions: [],
      difficulty: 4,
      mineBlock: jest.fn(),
      getLatestBlock: jest.fn()
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/mining', createMiningRoutes(mockBlockchain));
  });

  describe('POST /', () => {
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
        .post('/api/mining')
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('message', 'Block mined successfully');
      expect(response.body.block).toMatchObject({
        hash: mockBlock.hash,
        index: mockBlock.index,
        previousHash: mockBlock.previousHash,
        nonce: mockBlock.nonce
      });
      expect(response.body.block.transactions).toHaveLength(1);
      expect(response.body.block.transactions[0]).toMatchObject({
        hash: 'tx1',
        from: 'wallet1',
        to: 'wallet2',
        amount: 50
      });
      expect(mockBlockchain.mineBlock).toHaveBeenCalled();
    });

    it('should return 400 when there are no pending transactions', async () => {
      // Setup empty pending transactions
      mockBlockchain.pendingTransactions = [];

      // Make request
      const response = await request(app)
        .post('/api/mining')
        .expect(400);

      // Assertions
      expect(response.body).toHaveProperty('error', 'MiningError');
      expect(response.body).toHaveProperty('message', 'No transactions to mine');
      expect(mockBlockchain.mineBlock).not.toHaveBeenCalled();
    });

    it('should handle mining errors', async () => {
      // Setup mock data with error
      mockBlockchain.pendingTransactions = [{ hash: 'tx1' }];
      mockBlockchain.mineBlock.mockRejectedValue(new Error('Mining failed'));

      // Make request
      const response = await request(app)
        .post('/api/mining')
        .expect(400);

      // Assertions
      expect(response.body).toHaveProperty('error', 'MiningError');
      expect(response.body).toHaveProperty('message', 'Mining failed');
    });
  });

  describe('GET /status', () => {
    it('should return current mining status', async () => {
      // Setup mock data
      mockBlockchain.pendingTransactions = [{ hash: 'tx1' }];
      mockBlockchain.difficulty = 4;
      mockBlockchain.getLatestBlock.mockReturnValue({
        hash: 'latest-block-hash'
      });

      // Make request
      const response = await request(app)
        .get('/api/mining/status')
        .expect(200);

      // Assertions
      expect(response.body).toMatchObject({
        pendingTransactions: 1,
        difficulty: 4,
        lastBlockHash: 'latest-block-hash'
      });
      expect(mockBlockchain.getLatestBlock).toHaveBeenCalled();
    });

    it('should handle errors when getting mining status', async () => {
      // Setup mock to throw error
      mockBlockchain.getLatestBlock.mockImplementation(() => {
        throw new Error('Failed to get latest block');
      });

      // Make request
      const response = await request(app)
        .get('/api/mining/status')
        .expect(500);

      // Assertions
      expect(response.body).toHaveProperty('error', 'MiningError');
      expect(response.body).toHaveProperty('message', 'Failed to get mining status');
    });
  });
});