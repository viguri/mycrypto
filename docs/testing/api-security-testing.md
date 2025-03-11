# API Security Testing Guide

## Overview
This document details the API security testing procedures for MyCrypto, focusing on endpoint security, input validation, and authentication mechanisms.

## API Security Test Suite

### 1. Wallet API Security Tests

#### Connection Endpoint
```javascript
// POST /api/wallet/connect
describe('Wallet Connection Security', () => {
    it('validates Ethereum addresses', async () => {
        const response = await request(app)
            .post('/api/wallet/connect')
            .send({ address: 'invalid-address' });
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('InvalidAddress');
    });

    it('enforces rate limiting', async () => {
        // Test with 101 rapid requests
        const responses = await Promise.all(
            Array(101).fill().map(() => 
                request(app)
                    .post('/api/wallet/connect')
                    .send({ address: '0x1234567890123456789012345678901234567890' })
            )
        );
        expect(responses.some(r => r.status === 429)).toBe(true);
    });
});
```

### 2. Security Headers Testing

#### Required Security Headers
```javascript
describe('Security Headers', () => {
    const requiredHeaders = {
        'x-frame-options': 'DENY',
        'x-content-type-options': 'nosniff',
        'x-xss-protection': '1; mode=block',
        'strict-transport-security': 'max-age=31536000',
        'content-security-policy': expect.stringContaining("default-src 'self'")
    };

    Object.entries(requiredHeaders).forEach(([header, value]) => {
        it(`sets ${header} correctly`, async () => {
            const response = await request(app).get('/api/health');
            expect(response.headers[header]).toMatch(value);
        });
    });
});
```

### 3. CORS Configuration Tests

#### CORS Policy Validation
```javascript
describe('CORS Policy', () => {
    it('allows trusted origins', async () => {
        const response = await request(app)
            .get('/api/health')
            .set('Origin', 'http://localhost:3000');
        expect(response.headers['access-control-allow-origin'])
            .toBe('http://localhost:3000');
    });

    it('blocks untrusted origins', async () => {
        const response = await request(app)
            .get('/api/health')
            .set('Origin', 'http://malicious-site.com');
        expect(response.headers['access-control-allow-origin'])
            .toBeUndefined();
    });
});
```

### 4. Session Security Tests

#### Cookie Security
```javascript
describe('Session Cookie Security', () => {
    it('sets secure cookie attributes', async () => {
        const response = await request(app)
            .post('/api/wallet/connect')
            .send({ address: '0x1234567890123456789012345678901234567890' });

        expect(response.headers['set-cookie'][0]).toMatch(/HttpOnly/);
        expect(response.headers['set-cookie'][0]).toMatch(/Secure/);
        expect(response.headers['set-cookie'][0]).toMatch(/SameSite=Strict/);
    });

    it('enforces session expiration', async () => {
        const maxAge = 86400000; // 24 hours
        const response = await request(app)
            .post('/api/wallet/connect')
            .send({ address: '0x1234567890123456789012345678901234567890' });

        expect(response.headers['set-cookie'][0])
            .toMatch(new RegExp(`Max-Age=${maxAge}`));
    });
});
```

## Running API Security Tests

### Prerequisites
- Node.js 16+
- yarn
- Running MongoDB instance
- `.env.test` configuration

### Test Commands
```bash
# Run all API security tests
yarn test tests/api/security.test.js

# Run specific test suite
yarn test tests/api/security.test.js -t "Session Security"

# Run with coverage
yarn test:coverage tests/api/security.test.js
```

## Security Test Coverage Requirements

### Minimum Coverage Thresholds
```javascript
// jest.config.js
module.exports = {
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80
        },
        './src/api/routes/wallet/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        }
    }
};
```

## Continuous Integration

### GitHub Actions Workflow
```yaml
security-tests:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Install dependencies
      run: yarn install
    - name: Run API security tests
      run: yarn test:security
    - name: Upload coverage
      uses: codecov/codecov-action@v2
```

## Best Practices

### API Security Testing Guidelines
1. Always test with both valid and invalid inputs
2. Verify rate limiting across all endpoints
3. Check security headers on all responses
4. Test CORS with various origins
5. Validate session handling and timeout
6. Monitor test coverage metrics
7. Review security logs during tests

### Common Test Scenarios
1. Authentication bypass attempts
2. Input validation edge cases
3. Rate limit threshold testing
4. Session hijacking prevention
5. CORS policy enforcement
6. XSS payload detection
7. Cookie security attributes
