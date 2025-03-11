import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment-specific .env file
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: path.resolve(__dirname, '../../', envFile) });

// Environment configurations
import developmentConfig from './environments/development.js';
import productionConfig from './environments/production.js';
import testConfig from './environments/test.js';

// Determine the current environment
const env = process.env.NODE_ENV || 'development';

// Load environment-specific configuration
const envConfigs = {
  development: developmentConfig,
  production: productionConfig,
  test: testConfig,
};

const envConfig = envConfigs[env] || developmentConfig;

// Base configuration that applies to all environments
const baseConfig = {
  // Server configuration
  server: {
    env,
    apiPrefix: '/api',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },

  // Application version and info
  app: {
    name: 'MyCrypto',
    version: process.env.npm_package_version || '1.0.0',
  },
};

// Merge base config with environment-specific config
const config = {
  ...baseConfig,
  ...envConfig,
  // Ensure environment is always set correctly
  server: {
    ...baseConfig.server,
    ...envConfig.server,
    env,
    port: process.env.PORT || 3001,
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json'
  }
};

// Freeze the config object to prevent runtime modifications
Object.freeze(config);

export default config;

// Export environment name for external use
export const environment = env;
