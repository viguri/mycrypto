/**
 * API Response standardization utilities
 */

/**
 * Create a success response
 * @param {Object} data - Response data
 * @param {string} message - Success message
 * @param {number} status - HTTP status code (default: 200)
 * @param {Object} metadata - Optional metadata
 * @returns {Object} Standardized success response
 */
export const success = (data = null, message = 'Operation successful', status = 200, metadata = null) => {
    const response = {
        success: true,
        message,
        data,
        status,
        timestamp: new Date().toISOString()
    };

    if (metadata) {
        response.metadata = metadata;
    }

    return response;
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {string} error - Error type
 * @param {number} status - HTTP status code (default: 400)
 * @param {Object} details - Optional error details
 * @param {Error} originalError - Original error object (only used in development)
 * @returns {Object} Standardized error response
 */
export const error = (message = 'An error occurred', error = 'Error', status = 400, details = null, originalError = null) => {
    const response = {
        success: false,
        message,
        error,
        status,
        timestamp: new Date().toISOString()
    };

    if (details) {
        response.details = details;
    }

    // Include stack trace and original error in development
    if (process.env.NODE_ENV === 'development' && originalError) {
        response.debug = {
            stack: originalError.stack,
            originalError: originalError.message
        };
    }

    return response;
};

/**
 * Common error types
 * @constant
 * @readonly
 */
export const ErrorTypes = Object.freeze({
    VALIDATION: 'ValidationError',
    NOT_FOUND: 'NotFoundError',
    UNAUTHORIZED: 'UnauthorizedError',
    FORBIDDEN: 'ForbiddenError',
    INTERNAL: 'InternalError',
    RATE_LIMIT: 'RateLimitError',
    BAD_REQUEST: 'BadRequestError',
    CONFLICT: 'ConflictError',
    SERVICE_UNAVAILABLE: 'ServiceUnavailableError'
});

/**
 * HTTP Status codes mapped to error types
 * @constant
 * @readonly
 */
export const StatusCodes = Object.freeze({
    [ErrorTypes.VALIDATION]: 400,
    [ErrorTypes.BAD_REQUEST]: 400,
    [ErrorTypes.UNAUTHORIZED]: 401,
    [ErrorTypes.FORBIDDEN]: 403,
    [ErrorTypes.NOT_FOUND]: 404,
    [ErrorTypes.CONFLICT]: 409,
    [ErrorTypes.RATE_LIMIT]: 429,
    [ErrorTypes.INTERNAL]: 500,
    [ErrorTypes.SERVICE_UNAVAILABLE]: 503
});

/**
 * Create a paginated response
 * @param {Array} data - Array of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} total - Total number of items
 * @param {string} message - Success message
 * @returns {Object} Standardized paginated response
 */
export const paginated = (data = [], page = 1, limit = 10, total = 0, message = 'Data retrieved successfully') => ({
    ...success(data, message),
    pagination: {
        page: Number(page),
        limit: Number(limit),
        total: Number(total),
        pages: Math.ceil(total / limit)
    }
});