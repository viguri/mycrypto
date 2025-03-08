import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import logsRoutes from '@/api/routes/logs/index.js';
import { success, error, ErrorTypes } from '@/utils/response/index.js';
import { mockLogger } from '../../setup.js';

describe('Logs Routes', () => {
    let app;

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();

        // Setup express app
        app = express();
        app.use(express.json());
        app.use('/api/logs', logsRoutes());
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('GET /', () => {
        it('should return 200 for logs request', async () => {
            const response = await request(app)
                .get('/api/logs');

            expect(response.status).toBe(200);
        });
    });

    describe('GET /error', () => {
        it('should return 200 for error logs request', async () => {
            const response = await request(app)
                .get('/api/logs/error');

            expect(response.status).toBe(200);
        });
    });

    describe('GET /info', () => {
        it('should return 200 for info logs request', async () => {
            const response = await request(app)
                .get('/api/logs/info');

            expect(response.status).toBe(200);
        });
    });
});