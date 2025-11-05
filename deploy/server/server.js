/**
 * MyCrypto Server
 * 
 * This is the main server file that sets up the Express application with all necessary
 * middleware and route handlers. Configuration is managed through the config module
 * which loads settings from environment variables.
 * 
 * Environment Variables (see config.env.example):
 * - PORT: Server port (default: 3000)
 * - NODE_ENV: Environment mode (development/production/test)
 * - ALLOWED_ORIGINS: Comma-separated list of allowed CORS origins
 * - RATE_LIMIT_MAX: Maximum requests per 15 minutes window
 * - LOG_LEVEL: Logging level (error/warn/info/debug)
 */

import express from 'express';
import cors from 'cors';
import logger from './utils/logger/index.js';
import Blockchain from './blockchain/core/Blockchain.js';
import config from './config/index.js';
import { securityConfig } from './config/security.js';
import { createSecurityMiddleware } from './middleware/security.js';

// Import routes
import registrationRoutes from './api/routes/registration/index.js';
import transactionRoutes from './api/routes/transactions/index.js';
import miningRoutes from './api/routes/mining/index.js';
import blockchainRoutes from './api/routes/blockchain/index.js';
import logsRoutes from './api/routes/logs/index.js';

// Initialize blockchain
const blockchain = new Blockchain();

// Create Express app
const app = express();
const { port } = config.server;

// Apply security middleware stack
app.use(createSecurityMiddleware());

// Configure CORS with enhanced security settings
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || securityConfig.trustedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            logger.warn('Blocked request from unauthorized origin', {
                component: 'server',
                origin,
                allowedOrigins: securityConfig.trustedOrigins
            });
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: securityConfig.cors.allowedMethods,
    allowedHeaders: securityConfig.cors.allowedHeaders,
    exposedHeaders: securityConfig.cors.exposedHeaders,
    credentials: securityConfig.cors.credentials,
    maxAge: securityConfig.cors.maxAge
}));

// Body parser with size limits
app.use(express.json({ 
    limit: securityConfig.validation.maxPayloadSize,
    strict: true
}));

// Serve static files from the public directory
app.use(express.static('server/public'));

// Make debug page the default route
app.get('/', (req, res) => {
    res.sendFile('public/debug.html', { root: 'server' });
});

// Request timeout middleware
app.use((req, res, next) => {
    res.setTimeout(securityConfig.api.timeoutMs, () => {
        logger.warn('Request timeout', {
            component: 'server',
            method: req.method,
            url: req.url,
            timeout: securityConfig.api.timeoutMs
        });
        res.status(408).json({
            error: 'RequestTimeout',
            message: 'Request took too long to process'
        });
    });
    next();
});

// Set default headers and error handling middleware
app.use((req, res, next) => {
    // Set default headers
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Override res.json to log responses in development
    const originalJson = res.json;
    res.json = function(data) {
        if (config.server.env === 'development') {
            logger.debug('Outgoing response', {
                component: 'server',
                method: req.method,
                url: req.url,
                status: res.statusCode,
                error: res.statusCode >= 400 ? data.error : undefined
            });
        }
        return originalJson.call(this, data);
    };

    next();
});

// API versioning prefix
const { apiPrefix: API_PREFIX } = config.server;

// Test endpoint
app.get('/test', (req, res) => {
    try {
        logger.info('Test endpoint hit', {
            component: 'api'
        });
        res.json({ status: 'ok' });
    } catch (error) {
        console.error('Test endpoint error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Debug page endpoint - serves the debug page directly
app.get('/debug', (req, res) => {
    try {
        logger.info('Debug page accessed', {
            component: 'server'
        });
        res.sendFile('public/debug.html', { root: 'server' });
    } catch (error) {
        console.error('Debug page error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Diagnostic endpoint
app.get('/diagnostic', (req, res) => {
    try {
        const diagnosticInfo = {
            nodeVersion: process.version,
            environment: process.env.NODE_ENV,
            serverConfig: {
                port: config.server.port,
                apiPrefix: config.server.apiPrefix,
                environment: config.server.env
            },
            blockchainState: {
                initialized: blockchain.chain && blockchain.chain.length > 0,
                chainLength: blockchain.chain ? blockchain.chain.length : 0,
                pendingTransactions: blockchain.pendingTransactions ? blockchain.pendingTransactions.length : 0
            }
        };
        console.log('Diagnostic info:', diagnosticInfo);
        res.json(diagnosticInfo);
    } catch (error) {
        console.error('Diagnostic endpoint error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

// Simple test API endpoint
app.get('/api/test', (req, res) => {
    try {
        console.log('API test endpoint hit');
        return res.json({ message: 'API test endpoint successful' });
    } catch (error) {
        console.error('API test endpoint error:', error);
        return res.status(500).json({ error: error.message });
    }
});

// Mount routes
app.use(`${API_PREFIX}/registration`, registrationRoutes(blockchain));
app.use(`${API_PREFIX}/transactions`, transactionRoutes(blockchain));
app.use(`${API_PREFIX}/mining`, miningRoutes(blockchain));
app.use(`${API_PREFIX}/blockchain`, blockchainRoutes(blockchain));
app.use(`${API_PREFIX}/logs`, logsRoutes());

// Error handling middleware
app.use((err, req, res, next) => {
    // Log the error with detailed information
    console.error('DETAILED ERROR:', {
        message: err.message,
        stack: err.stack,
        url: req.url,
        method: req.method,
        headers: req.headers,
        params: req.params,
        query: req.query,
        body: req.body
    });

    logger.error('Unhandled error', {
        component: 'server',
        error: err.message,
        stack: config.server.env === 'development' ? err.stack : undefined,
        url: req.url,
        method: req.method
    });

    // Handle different types of errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'ValidationError',
            message: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            error: 'UnauthorizedError',
            message: 'Invalid or missing authentication token'
        });
    }

    // Generic error response - don't expose internal details in production
    res.status(err.status || 500).json({
        error: config.server.env === 'development' ? err.name : 'InternalError',
        message: config.server.env === 'development' ? err.message : 'An unexpected error occurred'
    });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).json({
        error: 'NotFound',
        message: 'The requested resource was not found'
    });
});

// Initialize logging system
async function initializeLogging() {
    try {
        const fs = await import('fs/promises');
        const path = await import('path');
        const { fileURLToPath } = await import('url');

        // Get the directory name of the current module
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);

        // Define log directories
        const logDir = path.join(__dirname, '..', 'logs');
        const logArchiveDir = path.join(logDir, 'archive');

        // Create log directories
        await fs.mkdir(logDir, { recursive: true });
        await fs.mkdir(logArchiveDir, { recursive: true });

        // Create empty log file if it doesn't exist
        const logFile = path.join(logDir, 'app.log');
        try {
            await fs.access(logFile);
        } catch {
            await fs.writeFile(logFile, '');
        }

        // Set file permissions
        await fs.chmod(logDir, 0o755);
        await fs.chmod(logArchiveDir, 0o755);
        await fs.chmod(logFile, 0o644);

        logger.info('Logging system initialized', {
            component: 'server',
            logDir,
            logFile,
            archiveDir: logArchiveDir
        });
    } catch (error) {
        console.error('Failed to initialize logging system:', error);
        process.exit(1);
    }
}

// Initialize and start server
(async () => {
    try {
        // Initialize logging first
        await initializeLogging();

        // Initialize blockchain
        await blockchain.initialize();

        // Start server
        app.listen(port, () => {
            logger.info('Server started', {
                component: 'server',
                port,
                env: config.server.env,
                genesisHash: blockchain.chain[0].hash,
                allowedOrigins: securityConfig.trustedOrigins
            });
        });

    } catch (error) {
        logger.error('Failed to start server', {
            component: 'server',
            error: error.message,
            stack: config.server.env === 'development' ? error.stack : undefined,
            critical: true
        });
        process.exit(1);
    }
})();

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception', {
        component: 'server',
        error: error.message,
        stack: config.server.env === 'development' ? error.stack : undefined,
        critical: true
    });
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection', {
        component: 'server',
        error: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error && config.server.env === 'development' ? reason.stack : undefined,
        critical: true
    });
    process.exit(1);
});