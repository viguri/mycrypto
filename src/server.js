import express from 'express';
import cors from 'cors';
import logger from './utils/logger/index.js';
import Blockchain from './blockchain/core/Blockchain.js';

// Import routes
import registrationRoutes from './api/routes/registration/index.js';
import transactionRoutes from './api/routes/transactions/index.js';
import miningRoutes from './api/routes/mining/index.js';
import blockchainRoutes from './api/routes/blockchain/index.js';

// Initialize blockchain
const blockchain = new Blockchain();

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Set default headers middleware
app.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    next();
});

// API versioning prefix
const API_PREFIX = '/api';

// Test endpoint
app.get('/test', (req, res) => {
    logger.info('Test endpoint hit', {
        component: 'api'
    });
    res.json({ status: 'ok' });
});

// Mount routes
app.use(`${API_PREFIX}/registration`, registrationRoutes(blockchain));
app.use(`${API_PREFIX}/transactions`, transactionRoutes(blockchain));
app.use(`${API_PREFIX}/mining`, miningRoutes(blockchain));
app.use(`${API_PREFIX}/blockchain`, blockchainRoutes(blockchain));

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Unhandled error', {
        component: 'server',
        error: err.message,
        stack: err.stack
    });

    // Ensure we always send JSON response even for errors
    res.status(err.status || 500).json({
        error: err.name || 'InternalError',
        message: err.message || 'An unexpected error occurred'
    });
});

// 404 handler - must be after all other routes
app.use((req, res) => {
    res.status(404).json({
        error: 'NotFound',
        message: 'The requested resource was not found'
    });
});

// Initialize and start server
(async () => {
    try {
        // Initialize blockchain
        await blockchain.initialize();

        // Start server
        app.listen(port, () => {
            logger.info('Server started', {
                component: 'server',
                port,
                genesisHash: blockchain.chain[0].hash
            });
        });

    } catch (error) {
        logger.error('Failed to start server', {
            component: 'server',
            error: error.message,
            critical: true
        });
        process.exit(1);
    }
})();