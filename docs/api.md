# API Documentation

## Response Format

All API responses follow a standardized format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "status": 200 // HTTP status code
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message here",
  "error": "ErrorType",
  "status": 400 // HTTP status code
}
```

### Error Types

- ValidationError: Invalid request data
- NotFoundError: Requested resource not found
- UnauthorizedError: Authentication required
- ForbiddenError: Permission denied
- InternalError: Server error

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

## Core Components

### CryptoService

[Previous CryptoService documentation remains unchanged...]

## API Routes

### Blockchain Routes (`/blockchain`)

Located in `src/api/routes/blockchain.js`

#### GET /blockchain

Get entire blockchain state.

- Response:

```json
{
  "success": true,
  "data": {
    "chain": [],
    "pendingTransactions": [],
    "stats": {
      "blockCount": 0,
      "pendingCount": 0,
      "walletCount": 0
    }
  }
}
```

#### GET /blockchain/block/:index

Get specific block.

- Parameters:
  - `index`: Number
- Success Response:

```json
{
  "success": true,
  "data": {
    "hash": "string",
    "previousHash": "string",
    "timestamp": "number",
    "transactions": []
  }
}
```

- Error Response (404):

```json
{
  "success": false,
  "message": "Block not found",
  "error": "NotFoundError",
  "status": 404
}
```

### Transaction Routes (`/transactions`)

Located in `src/api/routes/transactions.js`

#### POST /transactions

Create new transaction.

- Body:

```json
{
  "from": "string",
  "to": "string",
  "amount": "number"
}
```

- Success Response (201):

```json
{
  "success": true,
  "message": "Transaction created successfully",
  "data": {
    "hash": "string",
    "from": "string",
    "to": "string",
    "amount": "number",
    "timestamp": "number"
  },
  "status": 201
}
```

#### GET /transactions/pending

List pending transactions.

- Success Response:

```json
{
  "success": true,
  "data": {
    "transactions": []
  }
}
```

#### GET /transactions/wallet/:address

Get transaction history for address.

- Parameters:
  - `address`: String
- Success Response:

```json
{
  "success": true,
  "data": {
    "transactions": [],
    "count": "number"
  }
}
```

### Registration Routes (`/registration`)

Located in `src/api/routes/registration.js`

#### POST /registration/wallet

Create new wallet.

- Success Response (201):

```json
{
  "success": true,
  "message": "Wallet created successfully",
  "data": {
    "address": "string",
    "balance": "number",
    "createdAt": "number"
  },
  "status": 201
}
```

#### GET /registration/:address

Get wallet information.

- Parameters:
  - `address`: String
- Success Response:

```json
{
  "success": true,
  "data": {
    "address": "string",
    "balance": "number",
    "createdAt": "number",
    "isMainWallet": "boolean",
    "transactions": "number"
  }
}
```

### Mining Routes (`/mine`)

[Previous mining routes documentation remains unchanged...]

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

[Previous middleware documentation remains unchanged...]
