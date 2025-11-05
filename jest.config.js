/** @type {import('jest').Config} */
export default {
    testEnvironment: 'node',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/server/$1',
        '^@client/(.*)$': '<rootDir>/client/src/$1',
        '^@test/(.*)$': '<rootDir>/tests/$1'
    },
    transform: {},
    verbose: true,
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    resetMocks: true,
    restoreMocks: true,
    clearMocks: true,
    moduleFileExtensions: ['js'],
    testPathIgnorePatterns: ['/node_modules/'],
    moduleDirectories: ['node_modules', 'server', 'client/src', 'tests'],
    collectCoverageFrom: [
        'server/**/*.js',
        'client/src/**/*.js',
        '!tests/mocks/**'
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
        '/node_modules/',
        '\\.pnp\\.[^\\/]+$'
    ]
};