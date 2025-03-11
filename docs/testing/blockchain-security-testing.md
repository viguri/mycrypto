# Blockchain Security Testing Guide

## Overview
This document outlines the security testing procedures specific to blockchain interactions in MyCrypto, following the security requirements documented in `docs/security/blockchain-security.md`.

## Test Suites

### 1. Transaction Security Tests

#### Transaction Validation
```javascript
describe('Transaction Security', () => {
    it('validates transaction size', async () => {
        const oversizedTx = {
            from: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            data: 'x'.repeat(1024 * 1024) // 1MB of data
        };

        const response = await request(app)
            .post('/api/transaction/send')
            .send(oversizedTx);

        expect(response.status).toBe(413);
        expect(response.body.error).toBe('PayloadTooLarge');
    });

    it('verifies transaction signatures', async () => {
        const unsignedTx = {
            from: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            value: '1000000000000000000'
        };

        const response = await request(app)
            .post('/api/transaction/send')
            .send(unsignedTx);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('SignatureRequired');
    });
});
```

### 2. Mining Rate Limiting Tests

#### Mining Protection
```javascript
describe('Mining Security', () => {
    it('enforces mining rate limits', async () => {
        const validBlock = {
            nonce: '12345',
            transactions: [],
            previousHash: '0x000'
        };

        // Attempt multiple mining requests
        const requests = Array(11).fill().map(() => 
            request(app)
                .post('/api/mining/submit')
                .send(validBlock)
        );

        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.status === 429);
        expect(rateLimited.length).toBeGreaterThan(0);
    });
});
```

### 3. Block Validation Tests

#### Block Security
```javascript
describe('Block Security', () => {
    it('validates block structure', async () => {
        const invalidBlock = {
            nonce: 'invalid',
            transactions: null,
            previousHash: 'invalid'
        };

        const response = await request(app)
            .post('/api/blockchain/validate')
            .send(invalidBlock);

        expect(response.status).toBe(400);
        expect(response.body.error).toBe('InvalidBlockStructure');
    });

    it('prevents double spending', async () => {
        const transaction = {
            from: '0x1234567890123456789012345678901234567890',
            to: '0x0987654321098765432109876543210987654321',
            value: '1000000000000000000',
            nonce: 1
        };

        // Submit same transaction twice
        await request(app)
            .post('/api/transaction/send')
            .send(transaction);

        const duplicateResponse = await request(app)
            .post('/api/transaction/send')
            .send(transaction);

        expect(duplicateResponse.status).toBe(400);
        expect(duplicateResponse.body.error).toBe('DuplicateTransaction');
    });
});
```

### 4. Network Security Tests

#### Network Protection
```javascript
describe('Network Security', () => {
    it('validates peer connections', async () => {
        const maliciousPeer = {
            url: 'http://malicious-node.com',
            version: '1.0.0'
        };

        const response = await request(app)
            .post('/api/network/connect')
            .send(maliciousPeer);

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('UntrustedPeer');
    });

    it('enforces connection limits', async () => {
        const validPeer = {
            url: 'http://localhost:3002',
            version: '1.0.0'
        };

        // Attempt multiple peer connections
        const requests = Array(51).fill().map(() => 
            request(app)
                .post('/api/network/connect')
                .send(validPeer)
        );

        const responses = await Promise.all(requests);
        const limited = responses.filter(r => r.status === 429);
        expect(limited.length).toBeGreaterThan(0);
    });
});
```

## Security Monitoring Tests

### Event Logging
```javascript
describe('Security Monitoring', () => {
    it('logs security events', async () => {
        const invalidBlock = {
            nonce: 'invalid',
            transactions: null
        };

        await request(app)
            .post('/api/blockchain/validate')
            .send(invalidBlock);

        const logs = await request(app)
            .get('/api/logs/security')
            .query({ component: 'blockchain' });

        expect(logs.body).toContainEqual(
            expect.objectContaining({
                level: 'warn',
                component: 'blockchain',
                event: 'invalidBlock'
            })
        );
    });
});
```

## Running Blockchain Security Tests

### Test Commands
```bash
# Run all blockchain security tests
yarn test:blockchain-security

# Run specific test suite
yarn test tests/blockchain/security.test.js -t "Transaction Security"

# Run with coverage
yarn test:coverage tests/blockchain/security.test.js
```

## Best Practices

### Blockchain Security Testing Guidelines
1. Always validate transaction signatures
2. Test for double-spending scenarios
3. Verify block structure and chain integrity
4. Monitor mining rate limits
5. Validate peer connections
6. Check transaction size limits
7. Test network security measures

### Common Attack Scenarios to Test
1. Double spending attempts
2. Invalid block submissions
3. Network flooding
4. Malicious peer connections
5. Transaction replay attacks
6. Block validation bypass attempts
7. Mining rate limit bypass

## Continuous Integration

### Automated Security Checks
```yaml
blockchain-security:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v2
    - name: Setup Node.js
      uses: actions/setup-node@v2
    - name: Install dependencies
      run: yarn install
    - name: Run blockchain security tests
      run: yarn test:blockchain-security
    - name: Check test coverage
      run: yarn test:coverage:blockchain
```

## Security Metrics

### Coverage Requirements
```javascript
// jest.config.js
module.exports = {
    coverageThreshold: {
        './src/blockchain/': {
            branches: 90,
            functions: 90,
            lines: 90,
            statements: 90
        }
    }
};
```
