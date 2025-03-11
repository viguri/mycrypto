module.exports = {
    testEnvironment: 'jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@test/(.*)$': '<rootDir>/tests/$1',
        '\\.(css|less|sass|scss)$': '<rootDir>/tests/__mocks__/styleMock.js',
        '\\.(gif|ttf|eot|svg)$': '<rootDir>/tests/__mocks__/fileMock.js'
    },
    transform: {
        '^.+\\.(js|jsx)$': 'babel-jest'
    },
    verbose: true,
    testMatch: [
        '**/src/**/__tests__/**/*.test.{js,jsx}',
        '**/tests/**/*.test.{js,jsx}',
        '**/src/**/*.test.{js,jsx}'
    ],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    resetMocks: true,
    restoreMocks: true,
    clearMocks: true,
    moduleFileExtensions: ['js', 'jsx', 'json'],
    testPathIgnorePatterns: ['/node_modules/'],
    moduleDirectories: ['node_modules', 'src', 'tests'],
    collectCoverageFrom: [
        'src/**/*.{js,jsx}',
        '!src/**/__mocks__/**'
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/mocks/'
    ],
    modulePathIgnorePatterns: [
        '<rootDir>/dist/',
        '<rootDir>/build/'
    ],
    transformIgnorePatterns: [
        '/node_modules/(?!(@testing-library|react|react-dom)/)'
    ],
    // Security-specific test configuration
    globals: {
        __SECURITY_CONFIG__: {
            maxPayloadSize: 10240, // 10KB max payload size
            rateLimitWindow: 900000, // 15 minutes
            maxRequestsPerWindow: 100,
            cookieSecureOptions: {
                httpOnly: true,
                secure: true,
                sameSite: 'strict'
            },
            corsWhitelist: ['https://localhost:3000'],
            helmetOptions: {
                frameguard: { action: 'deny' },
                noSniff: true,
                xssFilter: true,
                hsts: {
                    maxAge: 31536000,
                    includeSubDomains: true,
                    preload: true
                }
            }
        }
    }
};