const request = require('supertest');
const express = require('express');
const registrationRoutes = require('../../../src/api/routes/registration');

// Mock the logger to avoid logging during tests
jest.mock('../../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
}));

// Mock CryptoService
jest.mock('../../../src/services/CryptoService', () => ({
  hash: jest.fn().mockResolvedValue('mocked-hash-address')
}));

describe('Registration Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Create mock blockchain with required methods
    mockBlockchain = {
      addWallet: jest.fn(),
      getAllWallets: jest.fn(),
      getWallet: jest.fn(),
      getWalletBalance: jest.fn(),
      getWalletTransactionCount: jest.fn()
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/register', registrationRoutes(mockBlockchain));
  });

  describe('POST /wallet', () => {
    it('should create a new wallet successfully', async () => {
      // Setup mocks
      mockBlockchain.addWallet.mockImplementation(() => true);

      // Make request
      const response = await request(app)
        .post('/api/register/wallet')
        .expect(201);

      // Assertions
      expect(response.body).toHaveProperty('wallet');
      expect(response.body.wallet).toHaveProperty('address', 'mocked-hash-address');
      expect(response.body.wallet).toHaveProperty('balance', 1000);
      expect(response.body.wallet).toHaveProperty('createdAt');
      expect(mockBlockchain.addWallet).toHaveBeenCalled();
    });

    it('should handle errors when creating wallet fails', async () => {
      // Setup mocks to simulate error
      mockBlockchain.addWallet.mockImplementation(() => {
        throw new Error('Failed to add wallet');
      });

      // Make request
      const response = await request(app)
        .post('/api/register/wallet')
        .expect(500);

      // Assertions
      expect(response.body).toHaveProperty('error', 'RegistrationError');
      expect(response.body).toHaveProperty('message', 'Failed to add wallet');
    });
  });

  describe('GET /wallets', () => {
    it('should return all wallets successfully', async () => {
      // Setup mock data
      const mockWallets = [
        { address: 'address1', balance: 1000, createdAt: Date.now() },
        { address: 'address2', balance: 2000, createdAt: Date.now() }
      ];
      mockBlockchain.getAllWallets.mockReturnValue(mockWallets);

      // Make request
      const response = await request(app)
        .get('/api/register/wallets')
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('wallets');
      expect(response.body.wallets).toHaveLength(2);
      expect(response.body).toHaveProperty('count', 2);
    });

    it('should handle errors when retrieving wallets fails', async () => {
      // Setup mock to return invalid data
      mockBlockchain.getAllWallets.mockReturnValue(null);

      // Make request
      const response = await request(app)
        .get('/api/register/wallets')
        .expect(500);

      // Assertions
      expect(response.body).toHaveProperty('error', 'RetrievalError');
    });
  });

  describe('GET /:address', () => {
    it('should return wallet info for valid address', async () => {
      // Setup mock data
      const mockWallet = {
        address: 'test-address',
        createdAt: Date.now()
      };
      mockBlockchain.getWallet.mockReturnValue(mockWallet);
      mockBlockchain.getWalletBalance.mockReturnValue(1000);
      mockBlockchain.getWalletTransactionCount.mockReturnValue(5);

      // Make request
      const response = await request(app)
        .get('/api/register/test-address')
        .expect(200);

      // Assertions
      expect(response.body).toHaveProperty('address', 'test-address');
      expect(response.body).toHaveProperty('balance', 1000);
      expect(response.body).toHaveProperty('transactionCount', 5);
      expect(response.body).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent wallet', async () => {
      // Setup mock to return null for non-existent wallet
      mockBlockchain.getWallet.mockReturnValue(null);

      // Make request
      const response = await request(app)
        .get('/api/register/non-existent-address')
        .expect(404);

      // Assertions
      expect(response.body).toHaveProperty('error', 'NotFound');
      expect(response.body).toHaveProperty('message', 'Wallet not found');
    });

    it('should handle errors when retrieving wallet info fails', async () => {
      // Setup mock to throw error
      mockBlockchain.getWallet.mockImplementation(() => {
        throw new Error('Failed to get wallet');
      });

      // Make request
      const response = await request(app)
        .get('/api/register/test-address')
        .expect(400);

      // Assertions
      expect(response.body).toHaveProperty('error', 'RetrievalError');
    });
  });
});