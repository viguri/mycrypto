import { jest } from '@jest/globals';

// Constants
export const MOCK_ADDRESS = 'test-address-123';
export const MOCK_PUBLIC_KEY = 'mock-public-key';
export const MOCK_PRIVATE_KEY = 'mock-private-key';
export const MOCK_SIGNATURE = 'mock-signature';
export const MOCK_HASH = 'mock-hash';

// Mock wallet data
export const mockWallet = {
    address: MOCK_ADDRESS,
    balance: 1000,
    createdAt: 1741125472631
};

// Mock blockchain response
export const mockBlockchain = {
    addWallet: jest.fn().mockResolvedValue(mockWallet),
    getWallet: jest.fn().mockResolvedValue(mockWallet),
    getAllWallets: jest.fn().mockResolvedValue([mockWallet]),
    hasWallet: jest.fn().mockResolvedValue(true),
    removeWallet: jest.fn().mockResolvedValue(true),
    getWalletTransactionCount: jest.fn().mockResolvedValue(5)
};

// Mock logs
export const mockLogs = {
    info: [
        {
            level: 'info',
            message: 'Test info log 1',
            timestamp: '2025-03-05T11:00:00.000Z'
        }
    ],
    error: [
        {
            level: 'error',
            message: 'Test error log 1',
            timestamp: '2025-03-05T12:00:00.000Z'
        }
    ]
};

// Reset all mock functions
export const resetMocks = () => {
    // Reset blockchain mock functions
    mockBlockchain.addWallet.mockClear();
    mockBlockchain.getWallet.mockClear();
    mockBlockchain.getAllWallets.mockClear();
    mockBlockchain.hasWallet.mockClear();
    mockBlockchain.removeWallet.mockClear();
    mockBlockchain.getWalletTransactionCount.mockClear();

    // Reset implementations
    mockBlockchain.addWallet.mockResolvedValue(mockWallet);
    mockBlockchain.getWallet.mockResolvedValue(mockWallet);
    mockBlockchain.getAllWallets.mockResolvedValue([mockWallet]);
    mockBlockchain.hasWallet.mockResolvedValue(true);
    mockBlockchain.removeWallet.mockResolvedValue(true);
    mockBlockchain.getWalletTransactionCount.mockResolvedValue(5);
};