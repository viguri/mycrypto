# MyCrypto Development Guide

This document provides an overview of the MyCrypto application architecture, key components, and development guidelines.

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Server Components](#server-components)
3. [Client Components](#client-components)
4. [API Endpoints](#api-endpoints)
5. [Development Workflow](#development-workflow)
6. [Testing](#testing)

## Architecture Overview

MyCrypto is a blockchain-based cryptocurrency application with a client-server architecture:

- **Backend**: Node.js Express server that manages the blockchain, wallets, and transactions
- **Frontend**: Browser-based client that interacts with the blockchain through the API

### Key Technologies

- **Server**: Express.js, Winston (logging)
- **Client**: Vanilla JavaScript, Fetch API
- **Storage**: File-based blockchain storage with automatic backups
- **Security**: Custom middleware for rate limiting, CORS, and request validation

### Directory Structure

```
/mycrypto
├── server/
│   ├── api/                 # API routes and handlers
│   ├── blockchain/          # Blockchain implementation
│   ├── config/              # Configuration files
│   ├── logs/                # Application logs
│   ├── middleware/          # Express middleware
│   ├── public/              # Static frontend files
│   ├── services/            # Business logic services
│   ├── storage/             # Data persistence
│   ├── utils/               # Utility functions
│   └── server.js            # Main application entry point
├── docs/                    # Documentation
├── TROUBLESHOOTING.md       # Troubleshooting guide
└── DEVELOPMENT_GUIDE.md     # This development guide
```

## Server Components

### Blockchain Core

The blockchain implementation is located in `/server/blockchain/core/Blockchain.js`. Key features:

- Block creation and validation
- Transaction processing
- Wallet management
- Mining functionality
- State persistence

```javascript
// Example: Creating a transaction
await blockchain.createTransaction({
  from: 'wallet-address-1',
  to: 'wallet-address-2',
  amount: 100
});

// Example: Mining a block
await blockchain.mineBlock();
```

### API Routes

API routes are organized by functionality in `/server/api/routes/`:

- `/registration`: Wallet creation and management
- `/transactions`: Transaction creation and retrieval
- `/mining`: Block mining
- `/blockchain`: Blockchain status and information
- `/logs`: System logs access

Each route module exports a function that accepts the blockchain instance:

```javascript
export default (blockchain) => {
  const router = express.Router();
  
  // Define routes
  router.get('/', async (req, res) => {
    // Route handler
  });
  
  return router;
};
```

### Logging System

The application uses Winston for logging, configured in `/server/utils/logger/index.js`:

- Log levels: error, warn, info, debug
- File-based logging with rotation
- Console output in development

```javascript
import logger from './utils/logger/index.js';

// Usage
logger.info('Operation successful', {
  component: 'module-name',
  metadata: { key: 'value' }
});
```

## Client Components

### Core JavaScript Files

- `app.js`: Main application initialization and UI management
- `wallet-manager.js`: Wallet UI and interaction
- `wallet.js`: Wallet data model and operations
- `api-client.js`: API communication wrapper
- `connection-monitor.js`: Network connectivity monitoring

### API Client

The `ApiClient` class in `api-client.js` provides standardized methods for API communication:

```javascript
// GET request
const data = await ApiClient.get('/api/endpoint');

// POST request
const result = await ApiClient.post('/api/endpoint', {
  key: 'value'
});

// DELETE request
await ApiClient.delete('/api/endpoint');
```

### Wallet Management

The `Wallet` class in `wallet.js` handles wallet operations:

```javascript
// Create a new wallet
const wallet = await Wallet.create();

// Load existing wallet
const wallet = await Wallet.load();

// Send transaction
await wallet.sendTransaction('recipient-address', 100);
```

## API Endpoints

### Registration API

- `POST /api/registration/wallet`: Create a new wallet
- `GET /api/registration/wallets`: Get all wallets
- `GET /api/registration/:address`: Get wallet by address
- `DELETE /api/registration/:address`: Delete wallet (admin only)

### Transactions API

- `POST /api/transactions`: Create a new transaction
- `GET /api/transactions`: Get all transactions
- `GET /api/transactions/wallet/:address`: Get transactions for a wallet
- `GET /api/transactions/:hash`: Get transaction by hash

### Mining API

- `POST /api/mining/mine`: Mine pending transactions
- `GET /api/mining/pending`: Get pending transactions

### Blockchain API

- `GET /api/blockchain`: Get blockchain status
- `GET /api/blockchain/blocks`: Get all blocks
- `GET /api/blockchain/blocks/:index`: Get block by index

## Development Workflow

### Environment Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables (see `config.env.example`)
4. Start the server: `npm start`

### Configuration

Environment-specific configuration is located in `/server/config/environments/`:

- `development.js`: Development environment settings
- `production.js`: Production environment settings
- `test.js`: Test environment settings

Common configuration is in `/server/config/index.js`.

### Port Configuration

The server runs on port 3003 (previously 3000). When making changes to the port:

1. Update the port in the appropriate environment config file
2. Update any documentation references to the port
3. Update any hardcoded client references to the port

## Testing

### Manual Testing

1. Start the server: `npm start`
2. Access the application at `http://localhost:3003`
3. Use the debug page at `http://localhost:3003/debug` for diagnostics

### API Testing

Use the included API testing documentation in `docs/api_testing.md` for guidance on testing API endpoints.

### Common Test Scenarios

1. **Wallet Creation**: Create a new wallet and verify it appears in the UI
2. **Transaction Flow**: Send funds between wallets and verify balances update
3. **Mining**: Mine blocks and verify transactions are confirmed
4. **Error Handling**: Test application behavior with invalid inputs and network errors

## Best Practices

### Error Handling

Always implement comprehensive error handling:

```javascript
try {
  // Operation that might fail
} catch (error) {
  console.error('Operation failed:', error);
  // Handle the error appropriately
  // Display user-friendly message
}
```

### API Communication

Follow these guidelines for API requests:

1. Always include error handling
2. Use the ApiClient class for standardized requests
3. Include credentials for authenticated endpoints
4. Validate responses before processing

### UI Updates

When updating the UI:

1. Check that elements exist before modifying them
2. Use defensive programming with null checks
3. Provide feedback for long-running operations
4. Handle and display errors in a user-friendly way
