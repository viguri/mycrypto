# VigCoin

A secure blockchain cryptocurrency implementation built with Node.js. This project demonstrates blockchain technology concepts with a focus on security and scalability.

## Features

### Core Blockchain
- Secure proof-of-work blockchain implementation
- Public/private key cryptography for transactions
- Digital signatures and transaction verification
- Merkle tree implementation for block integrity
- Transaction validation and memory pool
- Dynamic mining difficulty adjustment

### Memory Management
- Advanced heap allocation tracking and optimization
- Memory leak detection and prevention
- Memory fragmentation analysis and defragmentation
- Comprehensive memory profiling and monitoring
- Environment-specific memory configurations
- Automatic memory optimization and validation

### API & Interface
- Standardized REST API with comprehensive response format
- Frontend API client utility for consistent data handling
- Rate-limited endpoints with input validation
- Comprehensive error handling
- Web-based interface for blockchain interaction

## Technical Stack

### Core Technologies
- Backend: Node.js with Express
- Security: Node.js crypto module for cryptography
- Frontend: Vanilla JavaScript with ApiClient utility

### Memory Management
- Heap Tracking: Node.js v8 heap profiler
- Memory Profiling: Chrome DevTools Protocol
- Leak Detection: Custom monitoring system
- Metrics Collection: Prometheus compatible

### Development Tools
- Validation: Joi for request validation
- API Protection: Helmet and rate limiting
- Testing: Jest and Supertest
- Development: ESLint and Nodemon
- Package Manager: Yarn

## Project Structure

```
vigcoin/
├── src/
│   ├── blockchain/
│   │   ├── Block.js         # Block implementation
│   │   ├── Transaction.js   # Transaction implementation
│   │   └── Blockchain.js    # Core blockchain logic
│   ├── api/
│   │   ├── routes/         # API route handlers
│   │   ├── middlewares/    # Express middlewares
│   │   ├── validators/     # Request validation schemas
│   │   └── utils/          # Response handlers and utilities
│   ├── services/
│   │   └── CryptoService.js # Cryptography utilities
│   ├── config/            # Configuration files
│   └── utils/             # Utility functions
├── tests/                 # Test files
└── client/               # Web interface
    ├── src/
    ├── public/
    │   ├── api-client.js   # Frontend API client
    │   ├── wallet.js       # Wallet management
    │   └── app.js          # Main application logic
    └── index.html
```

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/vigcoin.git
cd vigcoin
```

2. Install dependencies:

```bash
yarn install
```

## Development

1. Start the development server:

```bash
yarn dev
```

2. Run tests:

```bash
yarn test
```

3. Lint code:

```bash
yarn lint
```

## API Response Format

All API endpoints follow a standardized response format:

### Success Response

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  },
  "status": 200
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error description",
  "error": "ErrorType",
  "status": 400
}
```

## Frontend API Client

The `ApiClient` utility provides a standardized way to interact with the API:

```javascript
// GET request
const blockchainData = await ApiClient.get("/api/blockchain");

// POST request with data
const transaction = await ApiClient.post("/api/transactions", {
  from: "sender-address",
  to: "recipient-address",
  amount: 50,
});

// Error handling
try {
  const wallet = await ApiClient.get(`/api/registration/${address}`);
} catch (error) {
  console.error("API Error:", error.message);
}
```

## API Endpoints

The server runs on `http://localhost:3000` and provides the following secure endpoints:

### Blockchain Operations

- `GET /blockchain` - Get the entire blockchain

  ```typescript
  Response {
    success: true,
    data: {
      chain: Block[],
      pendingTransactions: Transaction[],
      stats: {
        blockCount: number,
        pendingCount: number,
        walletCount: number
      }
    }
  }
  ```

- `GET /blockchain/validate` - Validate chain integrity
- `GET /blockchain/block/:index` - Get specific block

### Transaction Operations

- `POST /transactions` - Create a new transaction

  ```typescript
  Request {
    from: string,    // Sender address
    to: string,      // Recipient address
    amount: number   // Transaction amount
  }

  Response {
    success: true,
    message: "Transaction created successfully",
    data: {
      hash: string,
      from: string,
      to: string,
      amount: number,
      timestamp: number
    }
  }
  ```

- `GET /transactions/pending` - List pending transactions
- `GET /transactions/wallet/:address` - Get transaction history
- `GET /transactions/balance/:address` - Get wallet balance

### Wallet Operations

- `POST /registration/wallet` - Create new wallet

  ```typescript
  Response {
    success: true,
    message: "Wallet created successfully",
    data: {
      address: string,
      balance: number,
      createdAt: number
    }
  }
  ```

- `GET /registration/:address` - Get wallet information

### Mining Operations

- `POST /mine` - Mine a new block
- `GET /mine/stats` - Get mining statistics
- `GET /mine/difficulty` - Get current difficulty

## Performance & Security Features

### Memory Management
- **Heap Allocation Tracking**
  - Initial heap size configuration
  - Growth pattern monitoring
  - Allocation rate analysis
  - Object lifecycle tracking

- **Memory Leak Prevention**
  - Automated leak detection
  - Growth rate monitoring
  - Suspect object identification
  - Historical snapshot analysis

- **Fragmentation Management**
  - Real-time fragmentation analysis
  - Automated defragmentation
  - Compaction threshold monitoring
  - Block utilization tracking

- **Memory Profiling**
  - Configurable sampling rates
  - Stack trace analysis
  - Heap snapshot management
  - Call graph generation

### Security Features

This implementation includes:

1. **Standardized API Responses**
   - Consistent response format
   - Clear error messaging
   - Proper HTTP status codes
   - Type-safe responses

[Previous security sections remain unchanged...]

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Testing

Run the test suite:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch
```

## License

MIT License

## Author

Your Name
