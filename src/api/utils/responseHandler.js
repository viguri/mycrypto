/**
 * Standardized API response utilities
 */

/**
 * Create a success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Object} Standardized success response
 */
export const success = (data = null, message = 'Operation successful', status = 200) => ({
    success: true,
    message,
    data,
    status
});

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {string} error - Error type
 * @param {number} status - HTTP status code (default: 400)
 * @returns {Object} Standardized error response
 */
export const error = (message = 'An error occurred', error = 'Error', status = 400) => ({
    success: false,
    message,
    error,
    status
});

/**
 * Common error types
 */
export const ErrorTypes = {
    VALIDATION: 'ValidationError',
    NOT_FOUND: 'NotFoundError',
    UNAUTHORIZED: 'UnauthorizedError',
    FORBIDDEN: 'ForbiddenError',
    INTERNAL: 'InternalError'
};

/**
 * Response middleware to standardize API responses
 */
export const responseMiddleware = (req, res, next) => {
    // Override res.json to standardize response format
    const originalJson = res.json;
    res.json = function(data) {
        // If response is already standardized, send as is
        if (data && (typeof data === 'object') && ('success' in data)) {
            return originalJson.call(this, data);
        }

        // Standardize the response
        const statusCode = res.statusCode || 200;
        const standardizedResponse = success(data, 'Operation successful', statusCode);
        return originalJson.call(this, standardizedResponse);
    };

    next();
};