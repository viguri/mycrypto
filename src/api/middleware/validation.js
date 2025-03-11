/**
 * Request Validation Middleware
 * Implements security validation for API requests
 */

import logger from '../../utils/logger/index.js';

// Validation constants
const VALIDATION_LIMITS = {
    MAX_STRING_LENGTH: 1000,
    MAX_ARRAY_LENGTH: 100,
    MAX_OBJECT_DEPTH: 5,
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
    ALLOWED_CONTENT_TYPES: ['application/json'],
    SAFE_STRING_PATTERN: /^[a-zA-Z0-9\s\-_.,@/]+$/,
    ETHEREUM_ADDRESS_PATTERN: /^0x[a-fA-F0-9]{40}$/
};

/**
 * Sanitize and validate string input
 * @param {string} str - Input string to validate
 * @returns {boolean} - Whether the string is safe
 */
const isValidString = (str) => {
    if (typeof str !== 'string') return false;
    if (str.length > VALIDATION_LIMITS.MAX_STRING_LENGTH) return false;
    return VALIDATION_LIMITS.SAFE_STRING_PATTERN.test(str);
};

/**
 * Validate object depth to prevent prototype pollution
 * @param {object} obj - Object to check
 * @param {number} depth - Current depth
 * @returns {boolean} - Whether the object is safe
 */
const isValidObjectDepth = (obj, depth = 0) => {
    if (depth > VALIDATION_LIMITS.MAX_OBJECT_DEPTH) return false;
    if (typeof obj !== 'object' || obj === null) return true;
    
    return Object.values(obj).every(value => 
        Array.isArray(value) 
            ? value.length <= VALIDATION_LIMITS.MAX_ARRAY_LENGTH && value.every(item => isValidObjectDepth(item, depth + 1))
            : isValidObjectDepth(value, depth + 1)
    );
};

/**
 * Validate Ethereum address
 * @param {string} address - Ethereum address to validate
 * @returns {boolean} - Whether the address is valid
 */
const isValidEthereumAddress = (address) => {
    if (typeof address !== 'string') return false;
    return VALIDATION_LIMITS.ETHEREUM_ADDRESS_PATTERN.test(address);
};

/**
 * Main request validation middleware
 */
export const validateRequest = (req, res, next) => {
    try {
        // 1. Validate Content-Type
        const contentType = req.headers['content-type'];
        if (req.method !== 'GET' && !VALIDATION_LIMITS.ALLOWED_CONTENT_TYPES.includes(contentType)) {
            logger.warn('Invalid content type', {
                component: 'validation',
                contentType,
                allowed: VALIDATION_LIMITS.ALLOWED_CONTENT_TYPES
            });
            return res.status(415).json({
                error: 'UnsupportedMediaType',
                message: 'Invalid content type'
            });
        }

        // 2. Validate request body for non-GET requests
        if (req.method !== 'GET' && req.body) {
            // Check object depth
            if (!isValidObjectDepth(req.body)) {
                logger.warn('Invalid request body depth', {
                    component: 'validation',
                    body: req.body
                });
                return res.status(400).json({
                    error: 'InvalidRequest',
                    message: 'Request body too complex'
                });
            }

            // Validate specific fields based on endpoint
            if (req.path.includes('/wallet')) {
                if (req.body.address && !isValidEthereumAddress(req.body.address)) {
                    logger.warn('Invalid Ethereum address', {
                        component: 'validation',
                        address: req.body.address
                    });
                    return res.status(400).json({
                        error: 'InvalidAddress',
                        message: 'Invalid Ethereum address format'
                    });
                }
            }
        }

        // 3. Validate query parameters
        if (Object.keys(req.query).length > 0) {
            for (const [key, value] of Object.entries(req.query)) {
                if (!isValidString(value)) {
                    logger.warn('Invalid query parameter', {
                        component: 'validation',
                        parameter: key,
                        value
                    });
                    return res.status(400).json({
                        error: 'InvalidParameter',
                        message: `Invalid query parameter: ${key}`
                    });
                }
            }
        }

        // 4. Validate file uploads if present
        if (req.files) {
            for (const file of Object.values(req.files)) {
                if (file.size > VALIDATION_LIMITS.MAX_FILE_SIZE) {
                    logger.warn('File too large', {
                        component: 'validation',
                        fileName: file.name,
                        size: file.size
                    });
                    return res.status(413).json({
                        error: 'FileTooLarge',
                        message: 'Uploaded file exceeds size limit'
                    });
                }
            }
        }

        // All validations passed
        next();
    } catch (error) {
        logger.error('Validation error', {
            component: 'validation',
            error: error.message,
            stack: error.stack
        });
        
        res.status(500).json({
            error: 'ValidationError',
            message: 'Request validation failed'
        });
    }
};

export default validateRequest;
