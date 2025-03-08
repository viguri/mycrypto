import { jest } from '@jest/globals';

// Create mock log data
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

// Create mock logger
export const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    
    // Mock query method
    query: jest.fn().mockImplementation((options = {}) => {
        if (options.fail) {
            return Promise.reject(new Error('Query failed'));
        }

        let logs = [];
        if (options.level === 'error') {
            logs = mockLogs.error;
        } else if (options.level === 'info') {
            logs = mockLogs.info;
        } else {
            logs = [...mockLogs.info, ...mockLogs.error];
        }

        return Promise.resolve({ logs });
    }),

    // Reset helper
    reset() {
        this.info.mockClear();
        this.error.mockClear();
        this.warn.mockClear();
        this.debug.mockClear();
        this.query.mockClear();

        // Reset individual log methods
        this.info.mockImplementation((message) => {
            console.log(JSON.stringify({ 
                level: 'info', 
                message, 
                timestamp: new Date().toISOString() 
            }));
        });

        this.error.mockImplementation((message) => {
            console.log(JSON.stringify({ 
                level: 'error', 
                message, 
                timestamp: new Date().toISOString() 
            }));
        });

        // Reset query implementation
        this.query.mockImplementation((options = {}) => {
            if (options.fail) {
                return Promise.reject(new Error('Query failed'));
            }

            let logs = [];
            if (options.level === 'error') {
                logs = mockLogs.error;
            } else if (options.level === 'info') {
                logs = mockLogs.info;
            } else {
                logs = [...mockLogs.info, ...mockLogs.error];
            }

            return Promise.resolve({ logs });
        });
    }
};

// Reset mocks on initial export
mockLogger.reset();

export default mockLogger;