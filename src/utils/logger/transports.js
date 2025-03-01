const winston = require('winston');
const path = require('path');

// Custom format for concise logging
const customFormat = winston.format.printf(({ level, message, timestamp, context }) => {
    const ctx = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${ctx}`;
});

// Create separate transports for different log types
const transports = {
    error: new winston.transports.File({
        filename: path.join('logs', 'error.log'),
        level: 'error',
        format: winston.format.combine(
            winston.format.timestamp(),
            customFormat
        )
    }),
    
    access: new winston.transports.File({
        filename: path.join('logs', 'access.log'),
        format: winston.format.combine(
            winston.format.timestamp(),
            customFormat
        )
    }),
    
    blockchain: new winston.transports.File({
        filename: path.join('logs', 'blockchain.log'),
        format: winston.format.combine(
            winston.format.timestamp(),
            customFormat
        )
    }),

    console: new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            customFormat
        )
    })
};

// Export transports
module.exports = transports;