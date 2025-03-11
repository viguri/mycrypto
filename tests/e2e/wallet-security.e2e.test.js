import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { mockLogger } from '../setup.js';

describe('Wallet Security E2E Tests', () => {
  const validWallet = {
    address: '0x1234567890123456789012345678901234567890',
    balance: 1000
  };

  beforeAll(async () => {
    // Ensure we're starting with a clean state
    jest.clearAllMocks();
  });

  describe('Complete Wallet Connection Flow', () => {
    test('should handle secure wallet connection end-to-end', async () => {
      // Step 1: Initial security check
      const initialCheck = await request(app)
        .get('/api/security/status')
        .set('x-forwarded-proto', 'https');
      
      expect(initialCheck.status).toBe(200);
      expect(initialCheck.headers['strict-transport-security']).toBeDefined();
      expect(initialCheck.headers['x-frame-options']).toBe('DENY');

      // Step 2: Attempt wallet connection
      const connectResponse = await request(app)
        .post('/api/wallet/connect')
        .send({ address: validWallet.address })
        .set('Content-Type', 'application/json')
        .set('x-forwarded-proto', 'https');

      expect(connectResponse.status).toBe(200);
      expect(connectResponse.headers['set-cookie']).toBeDefined();
      expect(connectResponse.headers['set-cookie'][0]).toContain('HttpOnly');
      expect(connectResponse.headers['set-cookie'][0]).toContain('Secure');
      expect(connectResponse.headers['set-cookie'][0]).toContain('SameSite=Strict');

      // Step 3: Test rate limiting
      const requests = Array(101).fill().map(() =>
        request(app)
          .get('/api/wallet/balance')
          .query({ address: validWallet.address })
      );

      const responses = await Promise.all(requests);
      expect(responses[100].status).toBe(429); // Last request should be rate limited
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          securityEvent: true,
          message: expect.stringContaining('Rate limit exceeded')
        })
      );

      // Step 4: Test XSS prevention
      const maliciousPayload = {
        address: '<script>alert("xss")</script>',
        data: 'javascript:alert("xss")'
      };

      const xssResponse = await request(app)
        .post('/api/wallet/update')
        .send(maliciousPayload);

      expect(xssResponse.status).toBe(400);
      expect(xssResponse.body.error).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          securityEvent: true,
          message: expect.stringContaining('XSS attempt detected')
        })
      );

      // Step 5: Test payload size limits
      const largePayload = { data: 'a'.repeat(11000) }; // Exceeds 10KB limit
      const sizeResponse = await request(app)
        .post('/api/wallet/update')
        .send(largePayload);

      expect(sizeResponse.status).toBe(413);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          securityEvent: true,
          message: expect.stringContaining('Payload size exceeded')
        })
      );

      // Step 6: Test CORS protection
      const corsResponse = await request(app)
        .get('/api/wallet/balance')
        .set('Origin', 'http://malicious-site.com');

      expect(corsResponse.status).toBe(403);

      // Step 7: Test secure session handling
      const sessionResponse = await request(app)
        .get('/api/wallet/session')
        .set('Cookie', connectResponse.headers['set-cookie']);

      expect(sessionResponse.status).toBe(200);
      expect(sessionResponse.body).toHaveProperty('isSecure', true);

      // Step 8: Test logout security
      const logoutResponse = await request(app)
        .post('/api/wallet/logout')
        .set('Cookie', connectResponse.headers['set-cookie']);

      expect(logoutResponse.status).toBe(200);
      expect(logoutResponse.headers['set-cookie'][0]).toContain('Max-Age=0');
    });

    test('should prevent insecure connection attempts', async () => {
      const response = await request(app)
        .post('/api/wallet/connect')
        .set('x-forwarded-proto', 'http')
        .send({ address: validWallet.address });

      expect(response.status).toBe(301);
      expect(response.headers.location).toMatch(/^https:\/\//);
    });

    test('should handle multiple concurrent security events', async () => {
      const securityEvents = await Promise.all([
        // Attempt 1: Valid request
        request(app)
          .post('/api/wallet/connect')
          .set('x-forwarded-proto', 'https')
          .send({ address: validWallet.address }),

        // Attempt 2: XSS attempt
        request(app)
          .post('/api/wallet/connect')
          .send({ address: '<script>alert("xss")</script>' }),

        // Attempt 3: Rate limit test
        ...Array(50).fill().map(() =>
          request(app)
            .get('/api/wallet/balance')
            .query({ address: validWallet.address })
        ),

        // Attempt 4: Large payload
        request(app)
          .post('/api/wallet/update')
          .send({ data: 'a'.repeat(11000) })
      ]);

      // Verify security logging
      expect(mockLogger.error).toHaveBeenCalledTimes(expect.any(Number));
      const securityLogs = mockLogger.error.mock.calls.filter(
        call => call[0].securityEvent === true
      );
      expect(securityLogs.length).toBeGreaterThan(0);
    });
  });
});
