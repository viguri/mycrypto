#!/bin/bash
# Troubleshooting script for MyCrypto Docker deployment
# Run this on your server to diagnose and fix container issues

echo "=== MyCrypto Docker Troubleshooting ==="
echo "Checking Docker container status..."
docker ps -a

echo -e "\n=== Checking server container logs ==="
docker logs cryptoviguriorg-server-1

echo -e "\n=== Checking Docker Compose configuration ==="
cat docker-compose.yml

echo -e "\n=== Checking if logs directory exists and has proper permissions ==="
# Create logs directory if it doesn't exist
mkdir -p ./logs
chmod -R 777 ./logs
echo "Logs directory created/updated with proper permissions"

echo -e "\n=== Checking if logs API route exists ==="
if [ ! -f "./server/api/routes/logs/index.js" ]; then
  echo "Creating logs API route file..."
  mkdir -p ./server/api/routes/logs
  cat > ./server/api/routes/logs/index.js << 'EOF'
import express from 'express';
import { asyncHandler } from '../../../middleware/async.js';
import { logger } from '../../../utils/logger/index.js';

const logsRoutes = () => {
    const router = express.Router();
    
    // Get all logs
    router.get('/', asyncHandler(async (req, res) => {
        try {
            const logs = await logger.getLogs();
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error('Error retrieving logs:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs' });
        }
    }));

    // Get logs by level
    router.get('/level/:level', asyncHandler(async (req, res) => {
        try {
            const { level } = req.params;
            const logs = await logger.getLogsByLevel(level);
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error(`Error retrieving logs by level ${req.params.level}:`, error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs by level' });
        }
    }));

    // Get logs by component
    router.get('/component/:component', asyncHandler(async (req, res) => {
        try {
            const { component } = req.params;
            const logs = await logger.getLogsByComponent(component);
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error(`Error retrieving logs by component ${req.params.component}:`, error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs by component' });
        }
    }));

    return router;
};

export default logsRoutes;
EOF
  echo "Logs API route file created"
else
  echo "Logs API route file already exists"
fi

echo -e "\n=== Checking security middleware configuration ==="
if [ -f "./server/middleware/security.js" ]; then
  echo "Updating Content Security Policy configuration..."
  # Make a backup of the original file
  cp ./server/middleware/security.js ./server/middleware/security.js.bak
  
  # Update the CSP configuration
  sed -i 's/scriptSrc: (process.env.CSP_SCRIPT_SRC || '\''self'\'').split('\'','\'').map(src => `'\''${src}'\''`)/scriptSrc: process.env.CSP_SCRIPT_SRC ? process.env.CSP_SCRIPT_SRC.split('\'','\'').map(src => src === '\''self'\'' ? "'\''self'\''" : src) : ["'\''self'\''"]/' ./server/middleware/security.js
  sed -i 's/styleSrc: (process.env.CSP_STYLE_SRC || '\''self'\'').split('\'','\'').map(src => `'\''${src}'\''`)/styleSrc: process.env.CSP_STYLE_SRC ? process.env.CSP_STYLE_SRC.split('\'','\'').map(src => src === '\''self'\'' ? "'\''self'\''" : src) : ["'\''self'\''", "'\''unsafe-inline'\''"]/' ./server/middleware/security.js
  sed -i 's/imgSrc: (process.env.CSP_IMG_SRC || '\''self,data:,https:'\'').split('\'','\'').map(src => `'\''${src}'\''`)/imgSrc: process.env.CSP_IMG_SRC ? process.env.CSP_IMG_SRC.split('\'','\'').map(src => src === '\''self'\'' ? "'\''self'\''" : src) : ["'\''self'\''", "data:", "https:"]/' ./server/middleware/security.js
  sed -i 's/connectSrc: (process.env.CSP_CONNECT_SRC || '\''self'\'').split('\'','\'').map(src => `'\''${src}'\''`)/connectSrc: process.env.CSP_CONNECT_SRC ? process.env.CSP_CONNECT_SRC.split('\'','\'').map(src => src === '\''self'\'' ? "'\''self'\''" : src) : ["'\''self'\''"]/' ./server/middleware/security.js
  sed -i 's/fontSrc: (process.env.CSP_FONT_SRC || '\''self,https:,data:'\'').split('\'','\'').map(src => `'\''${src}'\''`)/fontSrc: process.env.CSP_FONT_SRC ? process.env.CSP_FONT_SRC.split('\'','\'').map(src => src === '\''self'\'' ? "'\''self'\''" : src) : ["'\''self'\''", "https:", "data:"]/' ./server/middleware/security.js
  
  echo "Content Security Policy configuration updated"
else
  echo "Security middleware file not found"
fi

echo -e "\n=== Checking environment variables ==="
if [ -f "./config.env.production" ]; then
  echo "Production environment file exists"
  cat ./config.env.production
else
  echo "Creating production environment file..."
  cat > ./config.env.production << 'EOF'
NODE_ENV=production
PORT=3003
ALLOWED_ORIGINS=https://crypto.viguri.org,http://localhost:3003,http://localhost:8080
LOG_LEVEL=info
BLOCKCHAIN_DIFFICULTY=4
EOF
  echo "Production environment file created"
fi

echo -e "\n=== Restarting Docker containers ==="
docker-compose down
docker-compose up -d

echo -e "\n=== Checking container status after restart ==="
sleep 5
docker ps -a

echo -e "\n=== Checking server container logs after restart ==="
docker logs cryptoviguriorg-server-1

echo -e "\n=== Troubleshooting complete ==="
echo "If the server container is still unhealthy, check the logs for specific errors."
echo "You may need to modify the Dockerfile to ensure proper permissions for log directories."
