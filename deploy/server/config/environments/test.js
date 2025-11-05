export default {
  server: {
    port: 3001, // Different port for test environment
    host: 'localhost',
    apiPrefix: '/api',
  },
  security: {
    cors: {
      origin: '*', // Allow all origins in test
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 10000, // Very high limit for testing
    },
    bodyLimit: '50kb',
  },
  blockchain: {
    difficulty: 1, // Minimal difficulty for fast tests
    miningReward: 50,
    genesisReward: 100,
  },
  logging: {
    level: 'debug',
    directory: 'logs/test',
    console: true,
    file: false, // Don't write logs to file in test
  },
  debug: {
    stackTrace: true,
    verboseErrors: true,
  },
};
