# API Reference

## Blockchain Endpoints

### Transaction Operations

#### Create Transaction
```http
POST /api/blockchain/transaction
```

**Security Features:**
- Transaction size validation (MAX_TRANSACTION_SIZE)
- Rate limiting (RATE_LIMIT_MAX_USER)
- Signature verification
- Input/output validation
- Validates transaction size
- Verifies digital signature
- Prevents double-spending

**Request Body:**
```json
{
  "inputs": [
    {
      "transactionId": "string",
      "outputIndex": "number",
      "amount": "number",
      "signature": "string"
    }
  ],
  "outputs": [
    {
      "address": "string",
      "amount": "number"
    }
  ],
  "signature": "string"
}
```

**Response:**
```json
{
  "message": "Transaction accepted",
  "id": "string"
}
```

**Error Responses:**
- 400: InvalidTransaction
- 413: TransactionTooLarge
- 429: TooManyRequests

#### Get Pending Transactions
```http
GET /api/blockchain/transactions/pending
```

**Security Features:**
- Rate limiting
- Response size validation
- Validates request data
- Checks value ranges
- Prevents regex DoS

**Response:**
```json
{
  "transactions": [
    {
      "id": "string",
      "inputs": [],
      "outputs": [],
      "timestamp": "number"
    }
  ]
}
```

### Block Operations

#### Submit Block
```http
POST /api/blockchain/block
```

**Security Features:**
- Block size validation (MAX_BLOCK_SIZE)
- Mining rate limiting (MINING_RATE_LIMIT)
- Proof-of-work verification
- Block verification timeout
- Validates block size
- Verifies proof of work
- Rate limited: 10 requests per minute
- Implements mining difficulty adjustment

**Request Body:**
```json
{
  "height": "number",
  "previousHash": "string",
  "timestamp": "number",
  "transactions": [],
  "nonce": "number",
  "hash": "string"
}
```

**Response:**
```json
{
  "message": "Block accepted",
  "height": "number",
  "hash": "string"
}
```

**Error Responses:**
- 400: InvalidBlock
- 413: BlockTooLarge
- 429: TooManyMiningRequests
- 408: BlockVerificationTimeout

#### Get Block by Height
```http
GET /api/blockchain/block/:height
```

**Security Features:**
- Input validation
- Rate limiting
- Validates request data
- Checks value ranges
- Prevents regex DoS

**Parameters:**
- height: Block height (number)

**Response:**
```json
{
  "height": "number",
  "previousHash": "string",
  "timestamp": "number",
  "transactions": [],
  "nonce": "number",
  "hash": "string"
}
```

**Error Responses:**
- 404: BlockNotFound
- 429: TooManyRequests

### Chain Operations

#### Get Chain Info
```http
GET /api/blockchain
```

**Security Features:**
- Rate limiting
- Response size validation
- Validates request data
- Checks value ranges
- Prevents regex DoS

**Response:**
```json
{
  "height": "number",
  "latestHash": "string",
  "difficulty": "number",
  "miningReward": "number"
}
```

#### Validate Chain
```http
GET /api/blockchain/validate
```

**Security Features:**
- Rate limiting
- Verification timeout
- Validates request data
- Checks value ranges
- Prevents regex DoS

**Response:**
```json
{
  "valid": "boolean",
  "height": "number"
}
```

**Error Responses:**
- 500: ValidationError
- 429: TooManyRequests

## Error Handling

All endpoints follow a standard error response format:

```json
{
  "error": "ErrorType",
  "message": "Human readable message"
}
```

### Common Error Types

1. **Transaction Errors**
   - InvalidTransaction
   - TransactionTooLarge
   - InsufficientFee
   - SignatureRequired

2. **Block Errors**
   - InvalidBlock
   - BlockTooLarge
   - BlockVerificationTimeout
   - BlockNotFound

3. **Rate Limiting**
   - TooManyRequests
   - TooManyMiningRequests

4. **Validation Errors**
   - ValidationError
   - InvalidInput

## Rate Limiting

Rate limits are applied per endpoint category:

1. **Transaction Operations**
   - Window: 15 minutes
   - Max requests per IP: 100
   - Max requests per user: 1000

2. **Mining Operations**
   - Window: 1 minute
   - Max requests: 10

3. **Read Operations**
   - Window: 15 minutes
   - Max requests per IP: 1000

Rate limit headers are included in responses:
```http
X-RateLimit-Limit: <max_requests>
X-RateLimit-Remaining: <remaining_requests>
X-RateLimit-Reset: <reset_timestamp>
```

## Best Practices

1. **Error Handling**
   - Always check error responses
   - Implement exponential backoff
   - Log error details

2. **Rate Limiting**
   - Monitor rate limit headers
   - Implement request queuing
   - Handle rate limit errors

3. **Security**
   - Use HTTPS
   - Validate request data
   - Handle timeouts
   - Monitor responses

## Security Headers

All responses include security headers:

```http
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Content-Security-Policy: default-src 'self'
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

## Request Validation

### Size Limits
- Body: Configured per endpoint
- Headers: 8kb
- URL: 2kb
- File uploads: Not supported

### Content Types
Supported content types:
- `application/json`
- `application/x-www-form-urlencoded`

### Input Validation
- Sanitizes all inputs
- Validates data types
- Checks value ranges
- Prevents regex DoS
