#!/bin/bash
# Script to create the logs API route on your remote server

SERVER_USER="viguri"
SERVER_IP="81.169.168.33"
REMOTE_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"

echo "Creating logs API route on server..."
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR/server/api/routes/logs && cat > $REMOTE_DIR/server/api/routes/logs/index.js << 'EOF'
/**
 * Logs API Routes
 * 
 * This module provides API endpoints for accessing and managing application logs.
 * It's part of the enhanced logging system that includes:
 * - In-memory store with indexing for fast queries
 * - File-based persistence with compression
 * - Maximum 5 archived log files
 * - Automatic rotation at 5MB file size
 */

import express from 'express';
import logger from '../../../utils/logger/index.js';

/**
 * Creates and configures the logs router
 * @returns {express.Router} Configured router with log endpoints
 */
export default function() {
    const router = express.Router();
    
    // Get all logs with optional filtering
    router.get('/', async (req, res) => {
        try {
            const { level, component, from, to, limit } = req.query;
            
            logger.info('Logs API accessed', {
                component: 'api',
                endpoint: '/logs',
                filters: { level, component, from, to, limit }
            });
            
            // Get logs from the logger (implementation depends on your logger)
            const logs = await logger.getLogs({
                level,
                component,
                from: from ? new Date(from) : undefined,
                to: to ? new Date(to) : undefined,
                limit: limit ? parseInt(limit, 10) : 100
            });
            
            res.json({ logs });
        } catch (error) {
            logger.error('Error retrieving logs', {
                component: 'api',
                error: error.message
            });
            
            res.status(500).json({
                error: 'Failed to retrieve logs',
                message: error.message
            });
        }
    });
    
    // Get log statistics
    router.get('/stats', (req, res) => {
        try {
            logger.info('Log stats API accessed', {
                component: 'api',
                endpoint: '/logs/stats'
            });
            
            // Get log statistics (implementation depends on your logger)
            const stats = logger.getStats();
            
            res.json(stats);
        } catch (error) {
            logger.error('Error retrieving log stats', {
                component: 'api',
                error: error.message
            });
            
            res.status(500).json({
                error: 'Failed to retrieve log statistics',
                message: error.message
            });
        }
    });
    
    // Clear logs (admin only)
    router.delete('/', (req, res) => {
        try {
            // This should be protected by authentication/authorization middleware
            logger.warn('Log clear API accessed', {
                component: 'api',
                endpoint: '/logs (DELETE)',
                user: req.user?.id || 'unknown'
            });
            
            // Clear logs (implementation depends on your logger)
            logger.clearLogs();
            
            res.json({ message: 'Logs cleared successfully' });
        } catch (error) {
            logger.error('Error clearing logs', {
                component: 'api',
                error: error.message
            });
            
            res.status(500).json({
                error: 'Failed to clear logs',
                message: error.message
            });
        }
    });
    
    return router;
}
EOF"
