import { jest } from '@jest/globals';

// Mock constants
export const MOCK_ADDRESS = 'test-address-123';
export const MOCK_PUBLIC_KEY = 'mock-public-key';
export const MOCK_PRIVATE_KEY = 'mock-private-key';
export const MOCK_SIGNATURE = 'mock-signature';
export const MOCK_HASH = 'mock-hash';

// Create mock functions
const generateKeyPair = jest.fn().mockResolvedValue(MOCK_ADDRESS);
const getPublicKey = jest.fn().mockReturnValue(MOCK_PUBLIC_KEY);
const getPrivateKey = jest.fn().mockReturnValue(MOCK_PRIVATE_KEY);
const sign = jest.fn().mockReturnValue(MOCK_SIGNATURE);
const verify = jest.fn().mockReturnValue(true);
const hash = jest.fn().mockReturnValue(MOCK_HASH);
const generateBlockHash = jest.fn().mockResolvedValue('0000' + 'a'.repeat(60));
const generateTransactionHash = jest.fn().mockReturnValue('0'.repeat(64));

// Create mock service
const CryptoService = {
    MOCK_ADDRESS,
    MOCK_PUBLIC_KEY,
    MOCK_PRIVATE_KEY,
    MOCK_SIGNATURE,
    MOCK_HASH,
    generateKeyPair,
    getPublicKey,
    getPrivateKey,
    sign,
    verify,
    hash,
    generateBlockHash,
    generateTransactionHash,

    // Helper to reset all mock functions
    reset() {
        generateKeyPair.mockClear();
        getPublicKey.mockClear();
        getPrivateKey.mockClear();
        sign.mockClear();
        verify.mockClear();
        hash.mockClear();
        generateBlockHash.mockClear();
        generateTransactionHash.mockClear();

        // Reset implementations
        generateKeyPair.mockResolvedValue(this.MOCK_ADDRESS);
        getPublicKey.mockReturnValue(this.MOCK_PUBLIC_KEY);
        getPrivateKey.mockReturnValue(this.MOCK_PRIVATE_KEY);
        sign.mockReturnValue(this.MOCK_SIGNATURE);
        verify.mockReturnValue(true);
        hash.mockReturnValue(this.MOCK_HASH);
        generateBlockHash.mockResolvedValue('0000' + 'a'.repeat(60));
        generateTransactionHash.mockReturnValue('0'.repeat(64));
    }
};

// Reset mocks on initial export
CryptoService.reset();

export default CryptoService;