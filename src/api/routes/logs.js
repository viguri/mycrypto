const express = require('express');
const logger = require('../../utils/logger');

// Async handler wrapper
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

const logsRoutes = () => {
    const router = express.Router();

    // Log client-side events
    router.post('/', asyncHandler(async (req, res) => {
        const { level, message, context } = req.body;

        if (!level || !message) {
            return res.status(400).json({
                error: 'ValidationError',
                message: 'Missing required fields'
            });
        }

        // Only log important client events
        if (level === 'error' || (level === 'warn' && context?.critical)) {
            logger.error('Client event', {
                component: 'client',
                clientMessage: message,
                clientLevel: level,
                ...(context?.critical && { critical: true })
            });
        }

        res.status(200).json({
            message: 'Event logged'
        });
    }));

    return router;
};

module.exports = logsRoutes;