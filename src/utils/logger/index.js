import winston from 'winston';
import transports from './transports.js';

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

// Export the logger instance
export default logger;