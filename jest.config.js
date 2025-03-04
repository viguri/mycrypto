/** @type {import('jest').Config} */
const config = {
  // Test environment
  testEnvironment: 'node',
  
  // Enable ES modules support
  transform: {},
  
  // Module resolution
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },

  // Clear mocks and modules between tests
  clearMocks: true,
  resetModules: true,

  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/index.js',
    '!src/utils/logger/**'
  ],
  coverageReporters: ['text', 'lcov'],

  // Test setup
  setupFilesAfterEnv: ['./tests/setup.js']
};

export default config;