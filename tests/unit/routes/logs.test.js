const request = require('supertest');
const express = require('express');
const logsRoutes = require('../../../src/api/routes/logs');

// Mock the logger to avoid logging during tests
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

const logger = require('../../../src/utils/logger');

describe('Logs Routes', () => {
  let app;

  beforeEach(() => {
    // Create express app and apply routes
    app = express();
    app.use(express.json());
    app.use('/api/logs', logsRoutes());

    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /', () => {
    it('should log error level events', async () => {
      const logData = {
        level: 'error',
        message: 'Test error message',
        context: {
          userId: '123'
        }
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message', 'Event logged');

      // Verify logger was called correctly
      expect(logger.error).toHaveBeenCalledWith('Client event', {
        component: 'client',
        clientMessage: 'Test error message',
        clientLevel: 'error'
      });
    });

    it('should log critical warning events', async () => {
      const logData = {
        level: 'warn',
        message: 'Test warning message',
        context: {
          critical: true,
          otherData: 'test'
        }
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message', 'Event logged');

      // Verify logger was called correctly
      expect(logger.error).toHaveBeenCalledWith('Client event', {
        component: 'client',
        clientMessage: 'Test warning message',
        clientLevel: 'warn',
        critical: true
      });
    });

    it('should not log non-critical warning events', async () => {
      const logData = {
        level: 'warn',
        message: 'Test warning message',
        context: {
          critical: false
        }
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message', 'Event logged');

      // Verify logger was not called
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should not log info level events', async () => {
      const logData = {
        level: 'info',
        message: 'Test info message'
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(200);

      // Verify response
      expect(response.body).toHaveProperty('message', 'Event logged');

      // Verify logger was not called
      expect(logger.error).not.toHaveBeenCalled();
      expect(logger.info).not.toHaveBeenCalled();
    });

    it('should return 400 when level is missing', async () => {
      const logData = {
        message: 'Test message'
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(400);

      // Verify error response
      expect(response.body).toHaveProperty('error', 'ValidationError');
      expect(response.body).toHaveProperty('message', 'Missing required fields');

      // Verify logger was not called
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should return 400 when message is missing', async () => {
      const logData = {
        level: 'error'
      };

      const response = await request(app)
        .post('/api/logs')
        .send(logData)
        .expect(400);

      // Verify error response
      expect(response.body).toHaveProperty('error', 'ValidationError');
      expect(response.body).toHaveProperty('message', 'Missing required fields');

      // Verify logger was not called
      expect(logger.error).not.toHaveBeenCalled();
    });
  });
});