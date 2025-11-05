const logger = require('../../utils/logger');

// Track ongoing requests
const activeRequests = new Map();

const requestTracker = (req, res, next) => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    activeRequests.set(requestId, {
        startTime,
        method: req.method,
        path: req.originalUrl
    });

    res.on('finish', () => {
        const request = activeRequests.get(requestId);
        if (request) {
            const duration = Date.now() - request.startTime;
            
            // Only log non-200 responses or slow requests
            if (res.statusCode >= 400 || duration > 1000) {
                logger.warn('Slow or failed request', {
                    requestId,
                    method: req.method,
                    path: req.originalUrl,
                    statusCode: res.statusCode,
                    duration: `${duration}ms`,
                    critical: res.statusCode >= 500
                });
            }
            
            activeRequests.delete(requestId);
        }
    });

    req.requestId = requestId;
    next();
};

const errorHandler = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let errorName = err.name || 'ServerError';
    
    // Handle not found errors
    if (err.message && err.message.toLowerCase().includes('not found')) {
        statusCode = 404;
        errorName = 'NotFound';
    }
    
    // Handle validation errors
    if (err.name === 'ValidationError' || err.message.toLowerCase().includes('invalid')) {
        statusCode = 400;
        errorName = 'ValidationError';
    }
    
    // Log error with appropriate level and context
    logger.error('Request failed', {
        error: err.message,
        errorName,
        code: err.code,
        statusCode,
        method: req.method,
        path: req.originalUrl,
        requestId: req.requestId,
        critical: statusCode >= 500,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });

    res.status(statusCode).json({
        error: errorName,
        message: err.message || 'An unexpected error occurred'
    });
};

const setupErrorHandlers = (app) => {
    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
        logger.error('Uncaught exception', {
            error: err.message,
            stack: err.stack,
            critical: true
        });
        // Give logger time to write before exiting
        setTimeout(() => process.exit(1), 1000);
    });

    // Handle unhandled rejections
    process.on('unhandledRejection', (err) => {
        logger.error('Unhandled rejection', {
            error: err.message,
            stack: err.stack,
            critical: true
        });
    });
};

module.exports = {
    errorHandler,
    requestTracker,
    setupErrorHandlers
};