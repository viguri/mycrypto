import request from 'supertest';
import express from 'express';
import CryptoService from '../../../src/services/CryptoService.js';
import { jest } from '@jest/globals';
import registrationRoutes from '../../../src/api/routes/registration/index.js';
import { FIXED_TIMESTAMP, testErrorHandler } from '../../setup.js';
import { TEST_WALLET_ADDRESS } from '../../../src/services/__mocks__/CryptoService.js';

describe('Registration Routes', () => {
  let app;
  let mockBlockchain;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create mock blockchain
// Mock the generateKeyPair method to return a consistent address
    jest.spyOn(CryptoService, 'generateKeyPair').mockResolvedValue('e56bc34a70a6262b3897cbcd02b13ebddc80058ee354f75c3f9d07ce3bd9aec0');
    mockBlockchain = {
      addWallet: jest.fn(),
      getAllWallets: jest.fn(() => []),
      getWallet: jest.fn(),
      hasWallet: jest.fn(() => false),
      removeWallet: jest.fn(),
      getWalletTransactionCount: jest.fn(() => 0)
    };

    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/registration', registrationRoutes(mockBlockchain));
    app.use(testErrorHandler);
  });

  describe('POST /wallet', () => {
    it('should create a new wallet successfully', async () => {
      const expectedWallet = {
        address: TEST_WALLET_ADDRESS,
        balance: 1000,
        createdAt: FIXED_TIMESTAMP
      };

      mockBlockchain.addWallet.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/registration/wallet')
        .expect(201);

      expect(response.body).toEqual({
        success: true,
        data: expectedWallet,
        wallet: expectedWallet
      });

      expect(mockBlockchain.addWallet).toHaveBeenCalledWith(expectedWallet);
    });

    it('should handle wallet creation errors', async () => {
      const error = new Error('Failed to create wallet');
      error.name = 'RegistrationError';
      mockBlockchain.addWallet.mockRejectedValue(error);

      const response = await request(app)
        .post('/api/registration/wallet')
        .expect(500);

      expect(response.body).toEqual({
        error: 'RegistrationError',
        message: 'Failed to create wallet'
      });
    });
  });

  describe('GET /wallets', () => {
    it('should return all wallets', async () => {
      const mockWallets = [
        { address: 'wallet1', balance: 100, createdAt: FIXED_TIMESTAMP },
        { address: 'wallet2', balance: 200, createdAt: FIXED_TIMESTAMP, isMainWallet: true }
      ];
      mockBlockchain.getAllWallets.mockReturnValue(mockWallets);

      const response = await request(app)
        .get('/api/registration/wallets')
        .expect(200);

      expect(response.body).toEqual({
        message: 'Wallets retrieved successfully',
        wallets: expect.arrayContaining([
          expect.objectContaining({
            address: 'wallet1',
            balance: 100,
            isMainWallet: false
          }),
          expect.objectContaining({
            address: 'wallet2',
            balance: 200,
            isMainWallet: true
          })
        ])
      });
    });

    it('should handle errors when getting wallets', async () => {
      const error = new Error('Failed to get wallets');
      error.name = 'RegistrationError';
      mockBlockchain.getAllWallets.mockImplementation(() => {
        throw error;
      });

      const response = await request(app)
        .get('/api/registration/wallets')
        .expect(500);

      expect(response.body).toEqual({
        error: 'RegistrationError',
        message: 'Failed to get wallets'
      });
    });
  });

  describe('GET /:address', () => {
    const mockWallet = {
      address: 'test-address',
      balance: 1000,
      createdAt: FIXED_TIMESTAMP
    };

    it('should return wallet info by address', async () => {
      mockBlockchain.getWallet.mockReturnValue(mockWallet);
      mockBlockchain.getWalletTransactionCount.mockReturnValue(5);

      const response = await request(app)
        .get(`/api/registration/${mockWallet.address}`)
        .expect(200);

      expect(response.body).toEqual({
        address: mockWallet.address,
        balance: mockWallet.balance,
        createdAt: mockWallet.createdAt,
        isMainWallet: false,
        transactions: 5
      });
    });

    it('should return 404 for non-existent wallet', async () => {
      mockBlockchain.getWallet.mockReturnValue(null);

      const response = await request(app)
        .get('/api/registration/non-existent')
        .expect(404);

      expect(response.body).toEqual({
        error: 'NotFound',
        message: 'Wallet not found'
      });
    });
  });

  describe('DELETE /:address', () => {
    beforeEach(() => {
      mockBlockchain.hasWallet.mockReturnValue(true);
    });

    it('should delete a wallet with admin privileges', async () => {
      const response = await request(app)
        .delete('/api/registration/test-address')
        .send({ isAdmin: true })
        .expect(200);

      expect(response.body).toEqual({
        message: 'Wallet deleted successfully'
      });
      expect(mockBlockchain.removeWallet).toHaveBeenCalledWith('test-address');
    });

    it('should return 403 without admin privileges', async () => {
      const response = await request(app)
        .delete('/api/registration/test-address')
        .send({ isAdmin: false })
        .expect(403);

      expect(response.body).toEqual({
        error: 'Forbidden',
        message: 'Admin privileges required'
      });
      expect(mockBlockchain.removeWallet).not.toHaveBeenCalled();
    });

    it('should return 404 for non-existent wallet', async () => {
      mockBlockchain.hasWallet.mockReturnValue(false);

      const response = await request(app)
        .delete('/api/registration/non-existent')
        .send({ isAdmin: true })
        .expect(404);

      expect(response.body).toEqual({
        error: 'NotFound',
        message: 'Wallet not found'
      });
    });

    it('should not allow deleting main wallet', async () => {
      const response = await request(app)
        .delete('/api/registration/main_wallet')
        .send({ isAdmin: true })
        .expect(400);

      expect(response.body).toEqual({
        error: 'InvalidOperation',
        message: 'Cannot delete main wallet'
      });
      expect(mockBlockchain.removeWallet).not.toHaveBeenCalled();
    });
  });
});