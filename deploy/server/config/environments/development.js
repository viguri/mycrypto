export default {
  server: {
    port: process.env.PORT || 3003,
    host: 'localhost',
    apiPrefix: '/api',
  },
  security: {
    cors: {
      origin: ['http://localhost:8080', 'http://127.0.0.1:62480'],
      credentials: true,
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: 1000, // More lenient for development
    },
    bodyLimit: '50kb', // Larger limit for testing
  },
  blockchain: {
    difficulty: 2, // Easier mining for development
    miningReward: 50,
    genesisReward: 100,
  },
  logging: {
    level: 'debug',
    directory: 'logs',
    console: true,
    file: true,
  },
  debug: {
    stackTrace: true,
    verboseErrors: true,
  },
};
