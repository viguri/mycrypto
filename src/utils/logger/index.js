const winston = require('winston');
const transports = require('./transports');

// Custom format for minimal logging
const minimalFormat = winston.format.printf(({ level, message, timestamp, context }) => {
    const baseLog = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    // Only include relevant context fields
    if (context) {
        const relevantContext = {};
        const importantFields = ['component', 'method', 'path', 'statusCode', 'critical', 'error'];
        
        importantFields.forEach(field => {
            if (context[field] !== undefined) {
                relevantContext[field] = context[field];
            }
        });

        if (Object.keys(relevantContext).length > 0) {
            return `${baseLog} | ${JSON.stringify(relevantContext)}`;
        }
    }
    
    return baseLog;
});

// Create the logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        minimalFormat
    ),
    transports: [
        transports.console,
        transports.error,
        transports.access,
        transports.blockchain
    ]
});

// Export focused logging interface
module.exports = {
    info: (message, context = {}) => {
        if (context.component || context.critical) {
            logger.info(message, { context });
        }
    },
    
    error: (message, context = {}) => {
        logger.error(message, { context });
    },
    
    warn: (message, context = {}) => {
        if (context.critical || context.security) {
            logger.warn(message, { context });
        }
    },
    
    debug: (message, context = {}) => {
        if (process.env.NODE_ENV === 'development') {
            logger.debug(message, { context });
        }
    },
    
    blockchain: (message, context = {}) => {
        logger.info(message, { 
            context: { ...context, component: 'blockchain' }
        });
    }
};