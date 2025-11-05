import { jest } from '@jest/globals';

// Mock constants
export const MOCK_ADDRESS = 'test-address-123';
export const MOCK_PUBLIC_KEY = 'mock-public-key';
export const MOCK_PRIVATE_KEY = 'mock-private-key';
export const MOCK_SIGNATURE = 'mock-signature';
export const MOCK_HASH = 'mock-hash';

// Create mock service
const mockCryptoService = {
    generateKeyPair: jest.fn().mockResolvedValue(MOCK_ADDRESS),
    getPublicKey: jest.fn().mockReturnValue(MOCK_PUBLIC_KEY),
    getPrivateKey: jest.fn().mockReturnValue(MOCK_PRIVATE_KEY),
    sign: jest.fn().mockReturnValue(MOCK_SIGNATURE),
    verify: jest.fn().mockReturnValue(true),
    hash: jest.fn().mockReturnValue(MOCK_HASH),

    // Helper to reset all mock functions
    reset() {
        this.generateKeyPair.mockClear();
        this.getPublicKey.mockClear();
        this.getPrivateKey.mockClear();
        this.sign.mockClear();
        this.verify.mockClear();
        this.hash.mockClear();

        // Reset implementations
        this.generateKeyPair.mockResolvedValue(MOCK_ADDRESS);
        this.getPublicKey.mockReturnValue(MOCK_PUBLIC_KEY);
        this.getPrivateKey.mockReturnValue(MOCK_PRIVATE_KEY);
        this.sign.mockReturnValue(MOCK_SIGNATURE);
        this.verify.mockReturnValue(true);
        this.hash.mockReturnValue(MOCK_HASH);
    }
};

export default mockCryptoService;