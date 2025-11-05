export default {
  server: {
    port: process.env.PORT || 3003,
    host: process.env.HOST || '0.0.0.0',
    apiPrefix: '/api',
  },
  security: {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['https://mycrypto.com'],
      credentials: true,
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    rateLimit: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
    },
    bodyLimit: '10kb',
  },
  blockchain: {
    difficulty: parseInt(process.env.BLOCKCHAIN_DIFFICULTY, 10) || 4,
    miningReward: parseFloat(process.env.MINING_REWARD) || 50,
    genesisReward: 100,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    directory: process.env.LOG_DIR || 'logs',
    console: false,
    file: true,
  },
  debug: {
    stackTrace: false,
    verboseErrors: false,
  },
};
