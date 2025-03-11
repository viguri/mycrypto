import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../../src/app.js';
import { mockLogger } from '../setup.js';

describe('Security Monitoring E2E Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Winston Logger Integration', () => {
    test('should log security events with proper structure', async () => {
      // Simulate security event
      await request(app)
        .post('/api/wallet/connect')
        .send({ address: '<script>alert("xss")</script>' });

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          timestamp: expect.any(String),
          component: 'security',
          securityEvent: true,
          message: expect.stringContaining('XSS attempt detected')
        })
      );
    });

    test('should track rate limiting events', async () => {
      // Generate multiple requests to trigger rate limiting
      const requests = Array(101).fill().map(() =>
        request(app)
          .get('/api/wallet/balance')
          .query({ address: '0x1234567890123456789012345678901234567890' })
      );

      await Promise.all(requests);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          securityEvent: true,
          message: expect.stringContaining('Rate limit exceeded'),
          rateLimitWindow: 900000, // 15 minutes as per config
          maxRequestsPerWindow: 100
        })
      );
    });
  });

  describe('Prometheus Metrics', () => {
    test('should expose security metrics endpoint', async () => {
      const response = await request(app)
        .get('/metrics')
        .set('Authorization', `Bearer ${process.env.METRICS_TOKEN}`);

      expect(response.status).toBe(200);
      expect(response.text).toContain('security_events_total');
      expect(response.text).toContain('rate_limit_exceeded_total');
      expect(response.text).toContain('xss_attempts_total');
    });
  });

  describe('Real-time Security Monitoring', () => {
    test('should track concurrent security violations', async () => {
      const securityEvents = [
        // XSS attempt
        request(app)
          .post('/api/wallet/connect')
          .send({ address: '<script>alert("xss")</script>' }),
        
        // Large payload
        request(app)
          .post('/api/wallet/update')
          .send({ data: 'a'.repeat(11000) }),
        
        // Invalid wallet format
        request(app)
          .post('/api/wallet/connect')
          .send({ address: 'invalid-format' })
      ];

      await Promise.all(securityEvents);

      // Verify all events were logged
      const securityLogs = mockLogger.error.mock.calls
        .filter(call => call[0].securityEvent === true);

      expect(securityLogs.length).toBe(3);
      expect(securityLogs.some(log => 
        log[0].message.includes('XSS attempt')
      )).toBe(true);
      expect(securityLogs.some(log => 
        log[0].message.includes('Payload size exceeded')
      )).toBe(true);
      expect(securityLogs.some(log => 
        log[0].message.includes('Invalid wallet format')
      )).toBe(true);
    });
  });

  describe('Alert System Integration', () => {
    test('should trigger alerts for critical security events', async () => {
      // Simulate multiple failed login attempts
      const failedLogins = Array(5).fill().map(() =>
        request(app)
          .post('/api/wallet/connect')
          .send({ address: 'invalid-address' })
      );

      await Promise.all(failedLogins);

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          securityEvent: true,
          alertType: 'critical',
          message: expect.stringContaining('Multiple failed login attempts')
        })
      );
    });
  });

  describe('Security Event Aggregation', () => {
    test('should aggregate related security events', async () => {
      // Generate multiple similar security events
      const similarEvents = Array(3).fill().map(() =>
        request(app)
          .post('/api/wallet/connect')
          .send({ address: '<script>alert("xss")</script>' })
      );

      await Promise.all(similarEvents);

      // Check for aggregated logging
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          level: 'error',
          securityEvent: true,
          aggregated: true,
          count: 3,
          eventType: 'xss_attempt'
        })
      );
    });
  });
});
