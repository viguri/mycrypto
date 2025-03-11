import request from 'supertest';
import express from 'express';
import { createSecurityMiddleware } from '../../src/middleware/security.js';
import walletRoutes from '../../src/api/routes/wallet/index.js';
import healthRoutes from '../../src/api/routes/health.js';

describe('API Security Tests', () => {
    let app;

    beforeEach(() => {
        app = express();
        app.use(createSecurityMiddleware());
        app.use('/api/wallet', walletRoutes);
        app.use('/api/health', healthRoutes);
    });

    describe('Security Headers', () => {
        it('should set secure headers', async () => {
            const response = await request(app).get('/api/health');
            
            expect(response.headers['x-frame-options']).toBe('DENY');
            expect(response.headers['x-content-type-options']).toBe('nosniff');
            expect(response.headers['x-xss-protection']).toBe('1; mode=block');
            expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
            expect(response.headers['content-security-policy']).toBeDefined();
        });

        it('should enforce CORS policy', async () => {
            const response = await request(app)
                .get('/api/health')
                .set('Origin', 'http://malicious-site.com');
            
            expect(response.headers['access-control-allow-origin']).toBeUndefined();
        });
    });

    describe('Rate Limiting', () => {
        it('should enforce rate limits', async () => {
            const requests = Array(101).fill().map(() => 
                request(app).get('/api/health')
            );

            const responses = await Promise.all(requests);
            const tooManyRequests = responses.filter(r => r.status === 429);
            expect(tooManyRequests.length).toBeGreaterThan(0);
        });
    });

    describe('Input Validation', () => {
        it('should validate wallet address format', async () => {
            const response = await request(app)
                .post('/api/wallet/connect')
                .send({ address: 'invalid-address' });

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('InvalidAddress');
        });

        it('should prevent XSS in request body', async () => {
            const response = await request(app)
                .post('/api/wallet/connect')
                .send({ 
                    address: '0x1234567890123456789012345678901234567890',
                    malicious: '<script>alert("xss")</script>' 
                });

            expect(response.status).toBe(200);
            expect(JSON.stringify(response.body)).not.toContain('<script>');
        });

        it('should reject oversized payloads', async () => {
            const largePayload = { data: 'a'.repeat(11000) };
            const response = await request(app)
                .post('/api/wallet/connect')
                .send(largePayload);

            expect(response.status).toBe(413);
        });
    });

    describe('Session Security', () => {
        it('should set secure session cookie', async () => {
            const response = await request(app)
                .post('/api/wallet/connect')
                .send({ address: '0x1234567890123456789012345678901234567890' });

            const cookies = response.headers['set-cookie'];
            expect(cookies).toBeDefined();
            expect(cookies[0]).toContain('HttpOnly');
            expect(cookies[0]).toContain('SameSite=Strict');
            if (process.env.NODE_ENV === 'production') {
                expect(cookies[0]).toContain('Secure');
            }
        });
    });

    describe('Health Check', () => {
        it('should report security status', async () => {
            const response = await request(app).get('/api/health');

            expect(response.status).toBe(200);
            expect(response.body.security).toBeDefined();
            expect(response.body.security.headers).toBeDefined();
            expect(response.body.security.session).toBeDefined();
            expect(response.body.security.cors).toBeDefined();
        });
    });
});
