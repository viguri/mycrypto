# API Testing Documentation

This document provides comprehensive testing instructions for all API endpoints in the VigCoin system.

## Registration Endpoints

### Create New Wallet

Creates a new wallet in the blockchain system.

```bash
curl -X POST http://localhost:3003/api/registration/wallet \
     -H "Content-Type: application/json"
```

Expected Response (200 OK):

```json
{
  "message": "Wallet registered successfully",
  "wallet": {
    "address": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
    "balance": 1000,
    "createdAt": 1740682000000
  }
}
```

### List All Wallets

Retrieves all wallets registered in the system.

```bash
curl -X GET http://localhost:3003/api/registration/wallets
```

Expected Response (200 OK):

```json
{
  "wallets": [
    {
      "address": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
      "balance": 1000,
      "createdAt": 1740682000000,
      "transactionCount": 0
    }
  ],
  "count": 1
}
```

### Get Specific Wallet Info

Retrieves details for a specific wallet.

```bash
curl -X GET http://localhost:3003/api/registration/6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7
```

Expected Response (200 OK):

```json
{
  "address": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
  "balance": 1000,
  "transactionCount": 0,
  "createdAt": 1740682000000
}
```

## Transaction Endpoints

### Create Transaction

Sends coins from one wallet to another.

```bash
curl -X POST http://localhost:3003/api/transactions \
     -H "Content-Type: application/json" \
     -d '{
       "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
       "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
       "amount": 50
     }'
```

Expected Response (201 Created):

```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
    "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
    "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
    "amount": 50,
    "timestamp": 1740682000000
  }
}
```

### List Pending Transactions

Retrieves all transactions that haven't been mined yet.

```bash
curl -X GET http://localhost:3003/api/transactions/pending
```

Expected Response (200 OK):

```json
{
  "count": 1,
  "transactions": [
    {
      "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
      "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
      "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
      "amount": 50,
      "timestamp": 1740682000000
    }
  ]
}
```

### Get Wallet Transactions

Retrieves all transactions (pending and confirmed) for a specific wallet.

```bash
curl -X GET http://localhost:3003/api/transactions/wallet/6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7
```

Expected Response (200 OK):

```json
[
  {
    "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
    "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
    "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
    "amount": 50,
    "timestamp": 1740682000000,
    "status": "pending"
  }
]
```

### Get Specific Transaction

Retrieves details for a specific transaction.

```bash
curl -X GET http://localhost:3003/api/transactions/8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b
```

Expected Response (200 OK):

```json
{
  "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
  "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
  "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
  "amount": 50,
  "timestamp": 1740682000000,
  "status": "pending"
}
```

## Blockchain Status

### Get Blockchain Info

Retrieves current blockchain status.

```bash
curl -X GET http://localhost:3003/api/blockchain
```

Expected Response (200 OK):

```json
{
  "blocks": 1,
  "pendingTransactions": 1,
  "wallets": 2,
  "genesisHash": "630052aeb99387d254800d2177121905502f76903c1f91efb2edd1aa5d7839b7"
}
```

## Security Testing

### Test Categories

#### 1. Security Tests

```javascript
describe('API Security', () => {
    it('should enforce body-parser size limits', async () => {
        const largePayload = Buffer.alloc(1024 * 1024).fill('X'); // 1MB
        const response = await request(app)
            .post('/api/blockchain/transaction')
            .send(largePayload);
        
        expect(response.status).toBe(413);
        expect(response.body.error).toBe('PayloadTooLarge');
    });

    it('should validate redirect URLs', async () => {
        const maliciousRedirect = 'http://malicious.com';
        const response = await request(app)
            .get(`/api/auth/callback?redirect=${maliciousRedirect}`);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('InvalidRedirectUrl');
    });

    it('should set secure cookie attributes', async () => {
        const response = await request(app)
            .post('/api/auth/login')
            .send(validCredentials);
        
        const cookie = response.headers['set-cookie'][0];
        expect(cookie).toContain('HttpOnly');
        expect(cookie).toContain('SameSite=Strict');
        if (process.env.NODE_ENV === 'production') {
            expect(cookie).toContain('Secure');
        }
    });

    it('should enforce rate limits', async () => {
        const requests = Array(101).fill().map(() => 
            request(app).get('/api/blockchain')
        );
        
        const responses = await Promise.all(requests);
        const rateLimited = responses.filter(r => r.status === 429);
        expect(rateLimited.length).toBeGreaterThan(0);
    });
});
```

#### 2. Input Validation

```javascript
describe('Input Validation', () => {
    it('should reject complex regex patterns', async () => {
        const complexPattern = '(a+)*b';
        const response = await request(app)
            .get(`/api/search?pattern=${complexPattern}`);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('InvalidPattern');
    });

    it('should sanitize query parameters', async () => {
        const xssPayload = '<script>alert("xss")</script>';
        const response = await request(app)
            .get(`/api/blockchain/block/${xssPayload}`);
        
        expect(response.status).toBe(400);
        expect(response.body.error).toBe('InvalidParameter');
    });
});
```

#### 3. Blockchain API Tests

```javascript
describe('Blockchain API', () => {
    it('should validate transaction size', async () => {
        const transaction = generateOversizedTransaction();
        const response = await request(app)
            .post('/api/blockchain/transaction')
            .send(transaction);
        
        expect(response.status).toBe(413);
        expect(response.body.error).toBe('TransactionTooLarge');
    });

    it('should enforce mining rate limits', async () => {
        for (let i = 0; i < 11; i++) {
            await request(app)
                .post('/api/blockchain/mine')
                .send(validBlock);
        }
        
        const response = await request(app)
            .post('/api/blockchain/mine')
            .send(validBlock);
        
        expect(response.status).toBe(429);
        expect(response.body.error).toBe('TooManyMiningRequests');
    });
});
```

## Testing Sequence

1. First create two wallets using the Create New Wallet endpoint
2. Verify the wallets were created using List All Wallets
3. Check individual wallet details using Get Specific Wallet Info
4. Create a transaction between the wallets
5. Verify the transaction appears in the pending list
6. Check both wallets' transaction histories
7. Look up the specific transaction details
8. Monitor the blockchain status throughout the process

## Error Cases

All endpoints include proper error handling. Common error responses:

### Not Found (404):

```json
{
  "error": "NotFound",
  "message": "Wallet not found"
}
```

### Bad Request (400):

```json
{
  "error": "TransactionError",
  "message": "Insufficient balance"
}
```

### Server Error (500):

```json
{
  "error": "ServerError",
  "message": "Internal server error"
}
```

## Test Environment Setup

1. Configure test environment:
```bash
# .env.test
NODE_ENV=test
RATE_LIMIT_WINDOW=1000
RATE_LIMIT_MAX_IP=10
MAX_PAYLOAD_SIZE=1kb
```

2. Set up test database:
```bash
npm run db:test:setup
```

## Running Tests

```bash
# Run all API tests
npm run test:api

# Run security-specific tests
npm run test:api:security

# Run with coverage
npm run test:api:coverage
```

## Test Reports

Reports are generated in `test-results/api`:
- JUnit XML reports
- Coverage reports
- Security audit reports

## Best Practices

1. **Security Testing**
   - Test all security middleware
   - Verify rate limiting
   - Check input validation
   - Test error handling

2. **API Testing**
   - Test all endpoints
   - Verify responses
   - Check status codes
   - Validate payloads

3. **Environment**
   - Use isolated test DB
   - Mock external services
   - Reset state between tests

4. **Monitoring**
   - Log test results
   - Track coverage
   - Monitor performance

## Continuous Integration

```yaml
api-tests:
  stage: test
  script:
    - npm install
    - npm run test:api
  artifacts:
    reports:
      junit: test-results/api/*.xml
      coverage: coverage/api/
