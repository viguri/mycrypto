# VigCoin

A secure blockchain cryptocurrency implementation built with Node.js. This project demonstrates blockchain technology concepts with a focus on security and scalability.

## Features

- Secure proof-of-work blockchain implementation
- Public/private key cryptography for transactions
- Digital signatures and transaction verification
- Merkle tree implementation for block integrity
- Transaction validation and memory pool
- Dynamic mining difficulty adjustment
- Rate-limited REST API with input validation
- Comprehensive error handling
- Web-based interface for blockchain interaction

## Technical Stack

- Backend: Node.js with Express
- Security: Node.js crypto module for cryptography
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
│   │   └── validators/     # Request validation schemas
│   ├── services/
│   │   └── CryptoService.js # Cryptography utilities
│   ├── config/            # Configuration files
│   └── utils/             # Utility functions
├── tests/                 # Test files
└── client/               # Web interface
    ├── src/
    ├── public/
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

## API Security Features

- Request validation for all endpoints
- Rate limiting to prevent abuse
- CORS protection
- Helmet security headers
- Error handling middleware
- Input sanitization

## API Endpoints

The server runs on `http://localhost:3000` and provides the following secure endpoints:

### Blockchain Operations

- `GET /blockchain` - Get the entire blockchain
- `GET /blockchain/validate` - Validate chain integrity
- `GET /blockchain/block/:index` - Get specific block

### Transaction Operations

- `POST /transactions` - Create a new transaction
  ```json
  {
    "fromAddress": "sender-address",
    "toAddress": "recipient-address",
    "amount": 50,
    "signature": "transaction-signature"
  }
  ```
- `GET /transactions/pending` - List pending transactions
- `GET /transactions/address/:address` - Get address history
- `GET /transactions/balance/:address` - Get address balance

### Mining Operations

- `POST /mine` - Mine a new block
  ```json
  {
    "minerAddress": "miner-address"
  }
  ```
- `GET /mine/stats` - Get mining statistics
- `GET /mine/difficulty` - Get current mining difficulty

## Security Considerations

This implementation includes:

1. **Cryptographic Security**

   - Public/private key pairs for wallets
   - Transaction signing and verification
   - Secure hash functions
   - Merkle trees for transaction verification

2. **Data Validation**

   - Input validation for all API endpoints
   - Transaction amount validation
   - Address format verification
   - Chain integrity checks

3. **API Protection**

   - Rate limiting
   - CORS protection
   - Security headers
   - Request sanitization

4. **Error Handling**
   - Custom error types
   - Detailed error messages
   - Global error handling
   - Validation error formatting

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
