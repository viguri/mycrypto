import { jest } from '@jest/globals';

// Test constants
const TEST_WALLET_ADDRESS = 'test-wallet-address';
const TEST_HASH = 'test-hash';
const FIXED_TIMESTAMP = 1234567890;

// Mock crypto module first (must be before CryptoService)
const mockDigest = jest.fn(() => TEST_WALLET_ADDRESS);
const mockUpdate = jest.fn(() => ({ digest: mockDigest }));
const mockCreateHash = jest.fn(() => ({ update: mockUpdate }));

jest.mock('crypto', () => ({
  createHash: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => TEST_WALLET_ADDRESS)
    }))
  })),
  generateKeyPairSync: jest.fn(() => ({
    publicKey: Buffer.from('test-public-key'),
    privateKey: Buffer.from('test-private-key')
  }))
}));

// Mock logger
const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

jest.mock('../src/utils/logger/index.js', () => ({
  default: mockLogger
}));

// Mock Date.now()
jest.spyOn(Date, 'now').mockImplementation(() => FIXED_TIMESTAMP);

// Create error handler
const testErrorHandler = (err, req, res, next) => {
  res.status(500).json({
    error: err.name || 'InternalError',
    message: err.message || 'An unexpected error occurred'
  });
};

// Export everything needed for tests
export {
  TEST_WALLET_ADDRESS,
  TEST_HASH,
  FIXED_TIMESTAMP,
  mockLogger,
  testErrorHandler,
  mockCreateHash,
  mockUpdate,
  mockDigest
};