import request from 'supertest';
import { jest } from '@jest/globals';
import app from '../../src/app.js';
import { mockLogger } from '../setup.js';

describe('Wallet API Security Tests', () => {
  const testWallet = {
    address: '0x1234567890123456789012345678901234567890',
    balance: 1000
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Security Headers', () => {
    test('endpoints return proper security headers from Helmet', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .query({ address: testWallet.address });

      // Check Helmet security headers
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains; preload');
      expect(response.headers['x-xss-protection']).toBe('1; mode=block');
    });
  });

  describe('Rate Limiting', () => {
    test('enforces rate limits on wallet endpoints', async () => {
      const requests = Array(101).fill().map(() =>
        request(app)
          .get('/api/wallet/balance')
          .query({ address: testWallet.address })
      );

      const responses = await Promise.all(requests);
      const lastResponse = responses[responses.length - 1];
      
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.error).toContain('Too Many Requests');
      expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
        securityEvent: true,
        message: expect.stringContaining('Rate limit exceeded')
      }));
    });
  });

  describe('Input Validation', () => {
    test('validates wallet address format', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .query({ address: 'invalid-wallet-format' });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
        securityEvent: true,
        message: expect.stringContaining('Invalid wallet address format')
      }));
    });

    test('prevents XSS in wallet address parameter', async () => {
      const maliciousAddress = '<script>alert("xss")</script>';
      const response = await request(app)
        .get('/api/wallet/balance')
        .query({ address: maliciousAddress });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeTruthy();
      expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
        securityEvent: true,
        message: expect.stringContaining('Potential XSS attack detected')
      }));
    });

    test('enforces payload size limits', async () => {
      const largePayload = 'a'.repeat(11000); // Exceeds 10KB limit
      const response = await request(app)
        .post('/api/wallet/create')
        .send({ data: largePayload });

      expect(response.status).toBe(413); // Payload Too Large
      expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
        securityEvent: true,
        message: expect.stringContaining('Payload size exceeded')
      }));
    });
  });

  describe('Cookie Security', () => {
    test('sets secure cookie attributes', async () => {
      const response = await request(app)
        .post('/api/wallet/session')
        .send({ address: testWallet.address });

      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(cookies[0]).toContain('HttpOnly');
      expect(cookies[0]).toContain('Secure');
      expect(cookies[0]).toContain('SameSite=Strict');
    });
  });

  describe('SSL/HTTPS', () => {
    test('redirects HTTP to HTTPS', async () => {
      const response = await request(app)
        .get('/api/wallet/balance')
        .set('x-forwarded-proto', 'http');

      expect(response.status).toBe(301);
      expect(response.headers.location).toMatch(/^https:\/\//);
    });
  });

  describe('Error Logging', () => {
    test('logs security-related errors with proper attributes', async () => {
      const maliciousPayload = {
        address: '<script>alert("xss")</script>',
        extraData: 'a'.repeat(11000)
      };

      await request(app)
        .post('/api/wallet/create')
        .send(maliciousPayload);

      expect(mockLogger.error).toHaveBeenCalledWith(expect.objectContaining({
        securityEvent: true,
        timestamp: expect.any(String),
        level: 'error',
        message: expect.any(String)
      }));
    });
  });
});
