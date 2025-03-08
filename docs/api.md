# API Documentation

This document provides an overview of the MyCrypto API. For detailed endpoint documentation, see the API reference guides.

## Quick Links

- [API Reference](./api/reference.md)
- [Authentication](./api/authentication.md)
- [Rate Limiting](./api/rate-limiting.md)
- [Error Handling](./api/error-handling.md)

## Core Components

### 1. Blockchain API

#### Transaction Endpoints
```javascript
POST /api/blockchain/transaction
GET  /api/blockchain/transactions/pending
```

Security Features:
- Transaction size validation
- Rate limiting
- Signature verification
- Input/output validation

#### Block Endpoints
```javascript
POST /api/blockchain/block
GET  /api/blockchain/block/:height
```

Security Features:
- Block size validation
- Mining rate limiting
- Proof-of-work verification
- Chain validation

### 2. Authentication

- Session-based authentication
- Secure cookie handling
- Rate limiting per IP/user
- Request validation

### 3. Error Handling

Standard error format:
```json
{
    "error": "ErrorType",
    "message": "Human readable message",
    "details": {} // Optional details
}
```

Common error types:
- InvalidTransaction
- BlockTooLarge
- TooManyRequests
- InvalidSignature

## Best Practices

1. **Rate Limiting**
   - Use exponential backoff
   - Handle rate limit errors
   - Monitor usage patterns

2. **Error Handling**
   - Check error types
   - Implement retry logic
   - Log API errors

3. **Security**
   - Use HTTPS
   - Validate inputs
   - Handle timeouts
   - Monitor responses

## Implementation Examples

See [API Examples](./api/examples.md) for detailed implementation examples.

## Frontend Utilities

### ApiClient

Located in `client/public/api-client.js`

Provides standardized API interaction for frontend code.

#### Methods

##### `handleResponse(response)`

Processes API responses and extracts data.

- Parameters:
  - `response`: Fetch API Response
- Returns: Processed response data
- Throws: Error with message on failure

##### `get(url, options)`

Makes GET request.

- Parameters:
  - `url`: String - API endpoint
  - `options`: Object - Fetch options
- Returns: Promise<any>

##### `post(url, data, options)`

Makes POST request.

- Parameters:
  - `url`: String - API endpoint
  - `data`: Object - Request body
  - `options`: Object - Fetch options
- Returns: Promise<any>

##### `delete(url, options)`

Makes DELETE request.

- Parameters:
  - `url`: String - API endpoint
  - `options`: Object - Fetch options
- Returns: Promise<any>

## Middleware

### Response Handler

Located in `src/api/utils/responseHandler.js`

Standardizes API responses across the application.

#### Functions

##### `success(data, message, status)`

Creates success response.

- Parameters:
  - `data`: any - Response data
  - `message`: String - Success message
  - `status`: Number - HTTP status code
- Returns: Standardized success response

##### `error(message, error, status)`

Creates error response.

- Parameters:
  - `message`: String - Error message
  - `error`: String - Error type
  - `status`: Number - HTTP status code
- Returns: Standardized error response
