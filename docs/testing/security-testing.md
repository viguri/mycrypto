# Security Testing Guide

This guide outlines the security testing practices and procedures for MyCrypto. It covers various aspects of security testing including authentication, input validation, API security, and blockchain-specific security measures.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Test Environment Setup](#test-environment-setup)
- [Security Test Categories](#security-test-categories)
- [Running Security Tests](#running-security-tests)
- [Continuous Integration](#continuous-integration)

## Prerequisites

- Node.js 16.x or higher
- Jest testing framework
- Supertest for API testing
- Security testing tools:
  - OWASP ZAP for dynamic testing
  - ESLint security plugins
  - npm audit / yarn audit

## Test Environment Setup

```bash
# Install dependencies
yarn install

# Install security testing tools
yarn add --dev jest supertest @types/jest @types/supertest
yarn add --dev eslint-plugin-security

# Verify dependency versions
yarn list body-parser cookie path-to-regexp send
```

## Security Test Categories

### 1. Authentication Tests

Test authentication mechanisms including:
- Session management with secure cookie settings (httpOnly, secure, sameSite)
- Token validation
- Password policies
- Rate limiting implementation
- Brute force protection

Example test:
```javascript
describe('Authentication Security', () => {
  it('should enforce rate limiting on login attempts', async () => {
    for (let i = 0; i < 6; i++) {
      await request(app)
        .post('/api/auth/login')
        .send({ username: 'test', password: 'wrong' });
    }
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'wrong' });
      
    expect(response.status).toBe(429);
  });

  it('should set secure cookie attributes', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'correct' });

    const cookies = response.headers['set-cookie'];
    expect(cookies[0]).toMatch(/HttpOnly/);
    expect(cookies[0]).toMatch(/Secure/);
    expect(cookies[0]).toMatch(/SameSite=Strict/);
  });
});
```

### 2. Input Validation Tests

Verify proper validation of:
- Request parameters and URL validation
- Headers
- Body content with size limits
- File uploads
- Complex regex pattern prevention

Example test:
```javascript
describe('Input Validation', () => {
  it('should reject oversized payloads', async () => {
    const maxSize = parseInt(process.env.MAX_PAYLOAD_SIZE || '10240');
    const largeData = 'x'.repeat(maxSize + 1);
    
    const response = await request(app)
      .post('/api/data')
      .send({ data: largeData });
      
    expect(response.status).toBe(413);
  });

  it('should validate redirect URLs', async () => {
    const response = await request(app)
      .get('/api/auth/callback')
      .query({ redirect: 'javascript:alert(1)' });
      
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('InvalidRedirect');
  });

  it('should prevent regex DoS patterns', async () => {
    const response = await request(app)
      .post('/api/validate')
      .send({ pattern: '(a+)+b' });
      
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('InvalidPattern');
  });
});
```

### 3. Blockchain Security Tests

Test blockchain-specific security features:
- Transaction signing
- Key management
- Smart contract interaction
- Gas limit validation

Example test:
```javascript
describe('Blockchain Security', () => {
  it('should validate transaction signatures', async () => {
    const tx = {
      to: '0x1234...',
      value: '1000000000000000000',
      data: '0x'
    };
    
    const response = await request(app)
      .post('/api/transaction/send')
      .send(tx);
      
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('InvalidSignature');
  });

  it('should enforce gas limits', async () => {
    const tx = {
      to: '0x1234...',
      value: '1000000000000000000',
      gasLimit: '999999999999999'
    };
    
    const response = await request(app)
      .post('/api/transaction/send')
      .send(tx);
      
    expect(response.status).toBe(400);
    expect(response.body.error).toBe('ExcessiveGasLimit');
  });
});
```

### 4. API Security Tests

Test API security controls including:
- CORS configuration
- Security headers using Helmet
- Content type validation
- Response format
- Rate limiting per IP/user

Example test:
```javascript
describe('API Security', () => {
  it('should include security headers', async () => {
    const response = await request(app).get('/api/status');
    
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['strict-transport-security']).toBeDefined();
  });

  it('should enforce CORS policy', async () => {
    const response = await request(app)
      .get('/api/status')
      .set('Origin', 'https://malicious-site.com');
    
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('should require JSON content-type for POST requests', async () => {
    const response = await request(app)
      .post('/api/data')
      .set('Content-Type', 'text/plain')
      .send('some data');
      
    expect(response.status).toBe(415);
  });
});
```

## Running Security Tests

```bash
# Run all security tests
yarn test:security

# Run specific test categories
yarn test:security:auth
yarn test:security:api
yarn test:security:blockchain

# Run dependency audit
yarn audit
```

## Continuous Integration

Security tests are integrated into the CI/CD pipeline:

1. Pre-commit hooks:
   - ESLint security checks
   - Dependency vulnerability scanning
   - Secure cookie settings validation
   - URL validation checks

2. CI Pipeline:
   - Automated security test suite
   - SAST (Static Application Security Testing)
   - Container security scanning
   - Dependency audit using yarn audit
   - Helmet configuration verification

3. Monitoring:
   - Test execution metrics
   - Security test coverage
   - Vulnerability tracking
   - Rate limiting effectiveness

## Best Practices

1. **Test Data Management**
   - Use dedicated test accounts
   - Reset test data between runs
   - Never use production credentials
   - Sanitize test data outputs

2. **Test Environment Security**
   - Isolate test environments
   - Use environment-specific configurations
   - Rotate test credentials regularly
   - Apply all security headers in test environment

3. **Test Coverage**
   - Maintain high security test coverage
   - Include negative test cases
   - Test error handling paths
   - Verify all security middleware configurations

4. **Reporting**
   - Document security test results
   - Track security metrics
   - Report vulnerabilities responsibly
   - Monitor rate limiting effectiveness

## References

- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST Security Testing Guidelines](https://www.nist.gov/cyberframework)
- [Web3 Security Testing Best Practices](https://consensys.net/diligence/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
