#!/bin/bash
set -e

echo "Starting MyCrypto deployment fix script..."

# Create the logs directory with proper permissions
echo "Creating logs directory with proper permissions..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chmod -R 777 /var/www/vhosts/viguri.org/crypto.viguri.org/logs

# Create the logs API route file
echo "Creating logs API route file..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/server/api/routes/logs

cat > /var/www/vhosts/viguri.org/crypto.viguri.org/server/api/routes/logs/index.js << 'LOGSAPI'
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createLogger } from '../../utils/logger/index.js';

const logger = createLogger('logs-api');
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default function logsRoutes() {
  const router = express.Router();
  
  // Get all logs
  router.get('/', async (req, res) => {
    try {
      const logDir = path.join(__dirname, '../../../../logs');
      
      // Ensure the logs directory exists
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
        logger.info(`Created logs directory at ${logDir}`);
        return res.json({ logs: [] });
      }
      
      const logFile = path.join(logDir, 'app.log');
      
      // Check if the log file exists
      if (!fs.existsSync(logFile)) {
        logger.info(`Log file does not exist at ${logFile}`);
        return res.json({ logs: [] });
      }
      
      // Read the log file
      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            return { raw: line, parseError: true };
          }
        });
      
      res.json({ logs });
    } catch (error) {
      logger.error(`Error retrieving logs: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve logs', details: error.message });
    }
  });
  
  // Get logs by component
  router.get('/component/:component', async (req, res) => {
    try {
      const { component } = req.params;
      const logDir = path.join(__dirname, '../../../../logs');
      const logFile = path.join(logDir, 'app.log');
      
      if (!fs.existsSync(logFile)) {
        return res.json({ logs: [] });
      }
      
      const logs = fs.readFileSync(logFile, 'utf8')
        .split('\n')
        .filter(line => line.trim() !== '')
        .map(line => {
          try {
            return JSON.parse(line);
          } catch (err) {
            return { raw: line, parseError: true };
          }
        })
        .filter(log => log.component === component);
      
      res.json({ logs });
    } catch (error) {
      logger.error(`Error retrieving logs for component ${req.params.component}: ${error.message}`);
      res.status(500).json({ error: 'Failed to retrieve logs', details: error.message });
    }
  });
  
  // Health check endpoint
  router.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
  
  return router;
}
LOGSAPI

# Create a test API endpoint for health checks
echo "Creating test API endpoint..."
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/server/api/routes/test/index.js << 'TESTAPI'
import express from 'express';

export default function testRoutes() {
  const router = express.Router();
  
  router.get('/', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'API is working properly', timestamp: new Date().toISOString() });
  });
  
  return router;
}
TESTAPI

# Update docker-compose.yml to fix health check
echo "Updating docker-compose.yml to fix health check..."
sed -i 's|"CMD", "curl", "-f", "http://localhost:3003/api/test"|"CMD-SHELL", "curl -f http://localhost:3003/api/test || exit 1"|g' /var/www/vhosts/viguri.org/crypto.viguri.org/docker-compose.yml

# Rebuild and restart the containers
echo "Rebuilding and restarting containers..."
cd /var/www/vhosts/viguri.org/crypto.viguri.org
docker-compose down
docker-compose build server
docker-compose up -d

echo "Fix script completed successfully!"
