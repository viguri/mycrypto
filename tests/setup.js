import { jest } from '@jest/globals';
import '@testing-library/jest-dom';
import CryptoService from '../src/services/__mocks__/CryptoService.js';
import mockFetch from './mocks/fetch.js';

// Create mock logger
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    query: jest.fn()
};

// Export mock logger for use in tests
export { mockLogger };

// Mock process.memoryUsage for consistent memory testing
const mockMemoryUsage = {
  heapTotal: 50 * 1024 * 1024,    // 50MB total heap
  heapUsed: 30 * 1024 * 1024,     // 30MB used heap
  external: 10 * 1024 * 1024,     // 10MB external
  arrayBuffers: 5 * 1024 * 1024,  // 5MB array buffers
  rss: 100 * 1024 * 1024         // 100MB resident set size
};

process.memoryUsage = jest.fn().mockReturnValue(mockMemoryUsage);

// Set up global fetch mock
global.fetch = mockFetch;

// Mock window.location for SSL tests
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'https:',
    hostname: 'localhost',
    port: '3000'
  },
  writable: true
});

// Security-related test utilities
global.securityUtils = {
  // Mock SSL verification
  mockSecureConnection: () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'https:' },
      writable: true
    });
  },
  mockInsecureConnection: () => {
    Object.defineProperty(window, 'location', {
      value: { protocol: 'http:' },
      writable: true
    });
  },
  // XSS prevention helpers
  containsXSS: (str) => {
    return /<script>|<\/script>|javascript:/i.test(str);
  },
  // Cookie security helpers
  getCookieAttributes: (cookieStr) => {
    return {
      httpOnly: /HttpOnly/.test(cookieStr),
      secure: /Secure/.test(cookieStr),
      sameSite: /SameSite=Strict/.test(cookieStr)
    };
  }
};

// Mock modules
jest.mock('@/utils/logger', () => ({
    __esModule: true,
    default: mockLogger
}));

jest.mock('@/services/CryptoService', () => ({
    __esModule: true,
    default: {
        generateKeyPair: jest.fn().mockResolvedValue('mock_address'),
        generateBlockHash: jest.fn().mockImplementation(block => {
            // Generate a valid hash based on difficulty
            const prefix = '0'.repeat(4); // Match blockchain difficulty
            return prefix + 'a'.repeat(60); // Complete 64-char hash
        }),
        generateTransactionHash: jest.fn().mockImplementation(tx => {
            return '0'.repeat(64); // Return a valid hash
        }),
        MOCK_ADDRESS: 'mock_address'
    },
    MOCK_ADDRESS: 'mock_address'
}));

// Mock blockchain storage
jest.mock('@/storage/blockchain/BlockchainStorage', () => ({
    __esModule: true,
    default: class MockBlockchainStorage {
        async initialize() {}
        constructor() {
            this.state = {
                chain: [],
                wallets: new Map([
                    ['main_wallet', {
                        address: 'main_wallet',
                        balance: 1000000,
                        createdAt: Date.now(),
                        isMainWallet: true
                    }]
                ]),
                pendingTransactions: []
            };
        }

        async initialize() {}

        async loadState() {
            return this.state;
        }

        async saveState(state) {
            this.state = state;
        }
    }
}));

// Configure test environment for memory management
global.gc = jest.fn();

// Default memory management configuration
global.__MEMORY_CONFIG__ = {
  heapInitialSize: '64m',
  heapMaxSize: '512m',
  heapGrowthRate: 1.5,
  gcTriggerRatio: 0.7,
  fragmentationThreshold: 0.3,
  memoryLeakThreshold: 0.1,
  profilingEnabled: true,
  samplingInterval: 100
};

// Reset all mocks and implementations before each test
beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Reset memory usage mock with default values
    process.memoryUsage.mockReturnValue(mockMemoryUsage);
    
    // Reset GC mock
    global.gc.mockClear();

    // Reset CryptoService mock
    const cryptoService = jest.requireMock('@/services/CryptoService').default;
    cryptoService.generateKeyPair.mockClear();
    cryptoService.generateBlockHash.mockClear();
    cryptoService.generateTransactionHash.mockClear();

    // Reset fetch mock with security headers
    mockFetch.mockClear();
    mockFetch.mockImplementation(() => Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'test' }),
        headers: new Map([
            ['content-type', 'application/json'],
            ['x-frame-options', 'DENY'],
            ['x-content-type-options', 'nosniff'],
            ['strict-transport-security', 'max-age=31536000; includeSubDomains']
        ])
    }));

    // Reset logger mock
    mockLogger.info.mockReset();
    mockLogger.error.mockReset();
    mockLogger.query.mockReset();

    // Set up logger mock implementation with security events
    mockLogger.query.mockImplementation(async (options = {}) => {
        if (options.fail === true) {
            throw new Error('Query failed');
        }

        const mockLogs = [
            {
                level: 'info',
                message: 'Test info log 1',
                timestamp: '2025-03-05T11:00:00.000Z',
                securityEvent: false
            },
            {
                level: 'error',
                message: 'Test error log 1',
                timestamp: '2025-03-05T12:00:00.000Z',
                securityEvent: true
            }
        ];

        let filteredLogs = [...mockLogs];

        if (options.level) {
            filteredLogs = filteredLogs.filter(log => log.level === options.level);
        }

        if (options.from) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= new Date(options.from));
        }

        if (options.to) {
            filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) <= new Date(options.to));
        }

        if (options.securityEvent !== undefined) {
            filteredLogs = filteredLogs.filter(log => log.securityEvent === options.securityEvent);
        }

        return { logs: filteredLogs };
    });

    // Configure CryptoService mock responses
    CryptoService.generateKeyPair.mockResolvedValue(CryptoService.MOCK_ADDRESS);

    // Reset window.location to secure HTTPS
    Object.defineProperty(window, 'location', {
        value: { protocol: 'https:' },
        writable: true
    });
});

// Cleanup after all tests
afterAll(() => {
    jest.restoreAllMocks();
});

// Add console error handler for React warnings
const originalError = console.error;
console.error = (...args) => {
    if (
        typeof args[0] === 'string' &&
        (args[0].includes('Warning: An update to %s inside a test was not wrapped in act') ||
         args[0].includes('Warning: ReactDOM.render is no longer supported'))
    ) {
        return;
    }
    originalError.call(console, ...args);
};