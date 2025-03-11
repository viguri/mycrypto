import express from 'express';
import rateLimit from 'express-rate-limit';
import logger from '../../utils/logger/index.js';

const router = express.Router();

// Rate limiter for health checks
const healthLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // limit each IP to 10 requests per minute
    message: {
        error: 'TooManyRequests',
        message: 'Too many health check requests'
    }
});

// Health check endpoint with security status
router.get('/', healthLimiter, (req, res) => {
    try {
        // Check security features
        const securityStatus = {
            https: req.secure,
            headers: {
                helmet: req.headers['x-powered-by'] === undefined,
                xssProtection: req.headers['x-xss-protection'] === '1; mode=block',
                frameOptions: req.headers['x-frame-options'] === 'DENY',
                contentSecurityPolicy: !!req.headers['content-security-policy']
            },
            session: req.session ? 'active' : 'inactive',
            cors: req.headers['access-control-allow-origin'] ? 'configured' : 'not configured'
        };

        // Log health check
        logger.info('Health check performed', {
            component: 'health',
            status: 'healthy',
            security: securityStatus
        });

        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            security: securityStatus,
            environment: process.env.NODE_ENV
        });
    } catch (error) {
        logger.error('Health check failed', {
            component: 'health',
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            status: 'unhealthy',
            error: 'HealthCheckError',
            message: 'Failed to perform health check'
        });
    }
});

export default router;
