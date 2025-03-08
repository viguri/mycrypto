import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Environment configurations
import developmentConfig from './environments/development.js';
import productionConfig from './environments/production.js';
import testConfig from './environments/test.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  },
};

// Freeze the config object to prevent runtime modifications
Object.freeze(config);

export default config;

// Export environment name for external use
export const environment = env;
