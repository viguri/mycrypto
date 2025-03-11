import logger from '../utils/logger/index.js';

// Request validation middleware with security best practices
export const validateRequest = (req, res, next) => {
    try {
        // Validate content type for POST/PUT requests
        if (['POST', 'PUT'].includes(req.method)) {
            const contentType = req.headers['content-type'];
            if (!contentType || !contentType.includes('application/json')) {
                return res.status(415).json({
                    error: 'UnsupportedMediaType',
                    message: 'Content-Type must be application/json'
                });
            }
        }

        // Validate payload size
        const contentLength = parseInt(req.headers['content-length'] || '0');
        const maxSize = parseInt(process.env.MAX_PAYLOAD_SIZE || '10240'); // 10KB default
        if (contentLength > maxSize) {
            logger.warn('Payload size exceeded', {
                component: 'validation',
                size: contentLength,
                maxSize,
                path: req.path
            });
            return res.status(413).json({
                error: 'PayloadTooLarge',
                message: `Request size ${contentLength} exceeds maximum ${maxSize} bytes`
            });
        }

        // Validate parameter count
        const paramCount = Object.keys(req.body || {}).length;
        const maxParams = parseInt(process.env.MAX_PARAMETER_COUNT || '100');
        if (paramCount > maxParams) {
            logger.warn('Parameter count exceeded', {
                component: 'validation',
                count: paramCount,
                maxParams,
                path: req.path
            });
            return res.status(400).json({
                error: 'TooManyParameters',
                message: `Request contains ${paramCount} parameters, exceeding maximum ${maxParams}`
            });
        }

        // Sanitize input to prevent XSS
        if (req.body) {
            sanitizeObject(req.body);
        }
        if (req.query) {
            sanitizeObject(req.query);
        }
        if (req.params) {
            sanitizeObject(req.params);
        }

        next();
    } catch (error) {
        logger.error('Request validation error', {
            component: 'validation',
            error: error.message,
            stack: error.stack,
            path: req.path
        });
        
        res.status(400).json({
            error: 'ValidationError',
            message: 'Invalid request format'
        });
    }
};

// Sanitize strings to prevent XSS
const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    return str
        .replace(/[<>]/g, '') // Remove potential HTML tags
        .replace(/javascript:/gi, '') // Remove potential JavaScript protocol
        .replace(/on\w+=/gi, '') // Remove potential event handlers
        .replace(/data:/gi, '') // Remove potential data URLs
        .trim();
};

// Recursively sanitize objects
const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object') return;

    Object.keys(obj).forEach(key => {
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object') {
            sanitizeObject(obj[key]);
        }
    });
};

export default validateRequest;
