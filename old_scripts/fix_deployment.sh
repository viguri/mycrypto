#!/bin/bash
# Script to fix deployment issues on crypto.viguri.org

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment fix for MyCrypto on crypto.viguri.org${NC}"

# 1. Create logs API route file
echo -e "${YELLOW}Creating logs API route file...${NC}"
mkdir -p server/api/routes/logs

cat > server/api/routes/logs/index.js << 'EOF'
import express from 'express';
import logger from '../../../utils/logger/index.js';

const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const logsRoutes = () => {
    const router = express.Router();

    // Get all logs
    router.get('/', asyncHandler(async (req, res) => {
        try {
            logger.info('Retrieved all logs');
            
            // Get query parameters for filtering
            const { level, component, startDate, endDate, limit = 100 } = req.query;
            
            // Get logs from the logger
            const logs = logger.getLogs({
                level,
                component,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                limit: parseInt(limit)
            });
            
            res.json({
                success: true,
                message: 'Logs retrieved successfully',
                data: logs,
                count: logs.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Failed to retrieve logs', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve logs',
                error: error.message
            });
        }
    }));

    // Get log statistics
    router.get('/stats', asyncHandler(async (req, res) => {
        try {
            logger.info('Retrieved log statistics');
            
            const stats = logger.getStats();
            
            res.json({
                success: true,
                message: 'Log statistics retrieved successfully',
                data: stats,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Failed to retrieve log statistics', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to retrieve log statistics',
                error: error.message
            });
        }
    }));

    // Clear logs
    router.delete('/', asyncHandler(async (req, res) => {
        try {
            logger.info('Clearing logs');
            
            logger.clearLogs();
            
            res.json({
                success: true,
                message: 'Logs cleared successfully',
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logger.error('Failed to clear logs', { error: error.message });
            res.status(500).json({
                success: false,
                message: 'Failed to clear logs',
                error: error.message
            });
        }
    }));

    return router;
};

export default logsRoutes;
EOF

echo -e "${GREEN}Logs API route file created successfully${NC}"

# 2. Fix the docker-compose.prod.yml file to use the correct Dockerfile
echo -e "${YELLOW}Updating docker-compose.prod.yml...${NC}"
sed -i 's/dockerfile: Dockerfile.fixed/dockerfile: Dockerfile/g' docker-compose.prod.yml

echo -e "${GREEN}docker-compose.prod.yml updated successfully${NC}"

# 3. Create necessary directories for logs
echo -e "${YELLOW}Creating log directories...${NC}"
mkdir -p logs/archive server/logs/archive
chmod -R 777 logs server/logs

echo -e "${GREEN}Log directories created successfully${NC}"

# 4. Rebuild and restart Docker containers
echo -e "${YELLOW}Rebuilding and restarting Docker containers...${NC}"
docker-compose -f docker-compose.prod.yml down || true
docker-compose -f docker-compose.prod.yml up -d --build

echo -e "${GREEN}Deployment fix completed!${NC}"
echo -e "${YELLOW}Check container status with: docker ps${NC}"
echo -e "${YELLOW}Check logs with: docker-compose -f docker-compose.prod.yml logs server${NC}"
