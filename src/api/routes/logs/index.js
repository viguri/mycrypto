import express from 'express';
import logger from '../../../utils/logger/index.js';
import { success, error, ErrorTypes } from '../../../utils/response/index.js';

const router = express.Router();

export default () => {
    // Get all logs with optional date range
    router.get('/', async (req, res) => {
        const { from, to, fail, component } = req.query;

        // Validate component if provided
        if (component && typeof component !== 'string') {
            return res.status(400).json(error(
                'Invalid component format',
                ErrorTypes.VALIDATION,
                400
            ));
        }

        // Simulate failure if requested
        if (fail === 'true') {
            logger.error('Simulated failure in logs retrieval');
            return res.status(500).json(error(
                'Failed to retrieve logs',
                ErrorTypes.INTERNAL,
                500
            ));
        }

        if (from && isNaN(Date.parse(from))) {
            return res.status(400).json(error(
                'Invalid date format',
                ErrorTypes.VALIDATION,
                400
            ));
        }

        if (to && isNaN(Date.parse(to))) {
            return res.status(400).json(error(
                'Invalid date format',
                ErrorTypes.VALIDATION,
                400
            ));
        }

        try {
            const options = {};
            if (from) options.from = new Date(from);
            if (to) options.to = new Date(to);
            if (component) options.component = component;

            const result = await logger.query(options);
            if (!result) {
                throw new Error('Failed to retrieve logs');
            }

            logger.info('Retrieved all logs');
            return res.json(success({
                logs: [...(result.info || []), ...(result.error || [])]
            }));
        } catch (err) {
            logger.error('Failed to retrieve logs', {
                error: err.message,
                component: 'api',
                stack: err.stack
            });
            return res.status(500).json(error(
                'Failed to retrieve logs',
                ErrorTypes.INTERNAL,
                500
            ));
        }
    });

    // Get error logs
    router.get('/error', async (req, res) => {
        try {
            const { fail, component } = req.query;
            
            // Validate component if provided
            if (component && typeof component !== 'string') {
                return res.status(400).json(error(
                    'Invalid component format',
                    ErrorTypes.VALIDATION,
                    400
                ));
            }

            // Simulate failure if requested
            if (fail === 'true') {
                logger.error('Simulated failure in error logs retrieval');
                return res.status(500).json(error(
                    'Failed to retrieve error logs',
                    ErrorTypes.INTERNAL,
                    500
                ));
            }

            const options = { level: 'error' };
            if (component) options.component = component;
            const result = await logger.query(options);
            if (!result || !result.error) {
                throw new Error('Failed to retrieve error logs');
            }

            logger.info('Retrieved error logs');
            return res.json(success({
                logs: result.error
            }));
        } catch (err) {
            logger.error('Failed to retrieve error logs', {
                error: err.message,
                component: 'api',
                stack: err.stack
            });
            return res.status(500).json(error(
                'Failed to retrieve error logs',
                ErrorTypes.INTERNAL,
                500
            ));
        }
    });

    // Get info logs
    router.get('/info', async (req, res) => {
        try {
            const { fail, component } = req.query;
            
            // Validate component if provided
            if (component && typeof component !== 'string') {
                return res.status(400).json(error(
                    'Invalid component format',
                    ErrorTypes.VALIDATION,
                    400
                ));
            }

            // Simulate failure if requested
            if (fail === 'true') {
                logger.error('Simulated failure in info logs retrieval');
                return res.status(500).json(error(
                    'Failed to retrieve info logs',
                    ErrorTypes.INTERNAL,
                    500
                ));
            }

            const options = { level: 'info' };
            if (component) options.component = component;
            const result = await logger.query(options);
            if (!result || !result.info) {
                throw new Error('Failed to retrieve info logs');
            }

            logger.info('Retrieved info logs');
            return res.json(success({
                logs: result.info
            }));
        } catch (err) {
            logger.error('Failed to retrieve info logs', {
                error: err.message,
                component: 'api',
                stack: err.stack
            });
            return res.status(500).json(error(
                'Failed to retrieve info logs',
                ErrorTypes.INTERNAL,
                500
            ));
        }
    });

    return router;
};