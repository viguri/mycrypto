const express = require('express');
const cors = require('cors');
const Blockchain = require('./blockchain/Blockchain');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Log middleware
app.use((req, res, next) => {
    logger.info('Request received', {
        component: 'server',
        method: req.method,
        path: req.path,
        ip: req.ip
    });
    next();
});

// Initialize blockchain and server
const startServer = async () => {
    try {
        // Create and initialize blockchain
        const blockchain = new Blockchain();
        await blockchain.initialize();

        // Import routes
        const blockchainRoutes = require('./api/routes/blockchain')(blockchain);
        const transactionRoutes = require('./api/routes/transactions')(blockchain);
        const registrationRoutes = require('./api/routes/registration')(blockchain);
        const miningRoutes = require('./api/routes/mining')(blockchain);

        // Mount routes
        app.use('/blockchain', blockchainRoutes);
        app.use('/transactions', transactionRoutes);
        app.use('/register', registrationRoutes);
        app.use('/mining', miningRoutes);

        // Test endpoint (matches proxy configuration)
        app.get('/test', (req, res) => {
            logger.info('Test endpoint hit', {
                component: 'api'
            });
            res.json({ status: 'ok' });
        });

        // Error handling middleware
        app.use((err, req, res, next) => {
            logger.error('Unhandled error', {
                component: 'server',
                error: err.message,
                stack: err.stack
            });

            res.status(500).json({
                error: 'ServerError',
                message: 'Internal server error'
            });
        });

        // Start server
        app.listen(PORT, () => {
            logger.info('Server started', {
                component: 'server',
                port: PORT,
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
};

// Start the server
startServer();