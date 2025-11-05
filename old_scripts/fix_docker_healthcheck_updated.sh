#!/bin/bash
# Script to fix Docker health check issues for MyCrypto deployment
# Updated with correct log folder path

echo "=== MyCrypto Docker Healthcheck Fix ==="

# Backup the original docker-compose.yml
echo "Creating backup of docker-compose.yml..."
cp docker-compose.yml docker-compose.yml.bak

# Update the health check configuration in docker-compose.yml
echo "Updating health check configuration in docker-compose.yml..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cryptoviguriorg-server-1
    restart: unless-stopped
    ports:
      - "3003:3003"
    volumes:
      - /var/www/vhosts/viguri.org/crypto.viguri.org/logs:/app/logs
      - ./server/storage:/app/server/storage
    environment:
      - NODE_ENV=production
      - PORT=3003
      - ALLOWED_ORIGINS=https://crypto.viguri.org,http://localhost:3003,http://localhost:8080
      - LOG_LEVEL=info
      - BLOCKCHAIN_DIFFICULTY=4
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/api/test"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  cli:
    build:
      context: .
      dockerfile: Dockerfile.cli
    container_name: cryptoviguriorg-cli-1
    depends_on:
      server:
        condition: service_healthy
    volumes:
      - ./cli-data:/app/cli-data
    environment:
      - NODE_ENV=production
      - SERVER_URL=http://server:3003
EOF

echo "Docker Compose configuration updated"

# Create a health check endpoint in the server
echo "Creating health check API endpoint..."
mkdir -p server/api/routes/health

cat > server/api/routes/health/index.js << 'EOF'
import express from 'express';
import { asyncHandler } from '../../../middleware/async.js';

const healthRoutes = () => {
    const router = express.Router();
    
    // Health check endpoint
    router.get('/', asyncHandler(async (req, res) => {
        res.status(200).json({ 
            status: 'ok',
            timestamp: new Date().toISOString()
        });
    }));

    return router;
};

export default healthRoutes;
EOF

# Update the API routes index to include the health route
echo "Updating API routes to include health endpoint..."
cat > server/api/routes/index.js << 'EOF'
import express from 'express';
import walletRoutes from './wallet/index.js';
import blockchainRoutes from './blockchain/index.js';
import transactionRoutes from './transaction/index.js';
import registrationRoutes from './registration/index.js';
import logsRoutes from './logs/index.js';
import healthRoutes from './health/index.js';

const router = express.Router();

router.use('/wallet', walletRoutes());
router.use('/blockchain', blockchainRoutes());
router.use('/transaction', transactionRoutes());
router.use('/registration', registrationRoutes());
router.use('/logs', logsRoutes());
router.use('/health', healthRoutes());

// Test endpoint
router.get('/test', (req, res) => {
    console.log('API test endpoint hit');
    res.json({ message: 'API is working!' });
});

export default router;
EOF

# Create logs directory with proper permissions
echo "Creating logs directory with proper permissions..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chmod -R 777 /var/www/vhosts/viguri.org/crypto.viguri.org/logs

# Ensure the server can access the logs directory
echo "Updating Dockerfile to use the correct logs path..."
if [ -f "Dockerfile" ]; then
    # Make a backup of the original Dockerfile
    cp Dockerfile Dockerfile.bak
    
    # Add a line to create the logs directory in the container
    sed -i '/WORKDIR \/app/a RUN mkdir -p /app/logs && chmod -R 777 /app/logs' Dockerfile
    
    echo "Dockerfile updated"
else
    echo "Dockerfile not found"
fi

# Rebuild and restart the containers
echo "Rebuilding and restarting Docker containers..."
docker-compose down
docker-compose build server
docker-compose up -d

echo "Waiting for containers to start..."
sleep 15

# Check container status
echo "Checking container status..."
docker ps -a

echo "Fix completed. If the server container is still unhealthy, check the logs again with:"
echo "docker logs cryptoviguriorg-server-1"
