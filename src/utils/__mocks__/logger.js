import { jest } from '@jest/globals';

// Create mock log data
const mockLogData = {
    info: [
        { level: 'info', message: 'Test info log 1', timestamp: '2025-03-05T11:00:00.000Z' }
    ],
    error: [
        { level: 'error', message: 'Test error log 1', timestamp: '2025-03-05T12:00:00.000Z' }
    ]
};

// Create mock logger instance
const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    
    // Mock query method with default implementation
    query: jest.fn().mockImplementation(options => {
        if (options && options.fail) {
            return Promise.reject(new Error('Query failed'));
        }

        if (options && options.level) {
            if (options.level === 'info') {
                return Promise.resolve({ info: mockLogData.info });
            }
            if (options.level === 'error') {
                return Promise.resolve({ error: mockLogData.error });
            }
        }

        return Promise.resolve(mockLogData);
    }),

    // Reset all mocks
    reset() {
        this.info.mockClear();
        this.error.mockClear();
        this.warn.mockClear();
        this.debug.mockClear();
        this.query.mockClear();

        // Reset query implementation
        this.query.mockImplementation(options => {
            if (options && options.fail) {
                return Promise.reject(new Error('Query failed'));
            }

            if (options && options.level) {
                if (options.level === 'info') {
                    return Promise.resolve({ info: mockLogData.info });
                }
                if (options.level === 'error') {
                    return Promise.resolve({ error: mockLogData.error });
                }
            }

            return Promise.resolve(mockLogData);
        });
    }
};

// Export mock logger and data
export default mockLogger;
export { mockLogData as mockLogs };