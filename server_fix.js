// Create a modified version of the server.js file that properly handles the logs API route
try {
  const fs = require('fs');
  const path = require('path');
  
  // Path to the server.js file
  const serverFilePath = path.join('/Users/viguri/GitHub/mycrypto/server/server.js');
  
  // Read the server.js file
  const serverContent = fs.readFileSync(serverFilePath, 'utf8');
  
  // Create the logs API route directory on the server
  const logsRoutePath = path.join('/Users/viguri/GitHub/mycrypto/server/api/routes/logs');
  if (!fs.existsSync(logsRoutePath)) {
    fs.mkdirSync(logsRoutePath, { recursive: true });
  }
  
  // Create the logs API route file
  const logsRouteContent = `import express from 'express';
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

export default logsRoutes;`;
  
  fs.writeFileSync(path.join(logsRoutePath, 'index.js'), logsRouteContent);
  
  console.log('Successfully created logs API route file');
} catch (error) {
  console.error('Error creating logs API route file:', error);
}
