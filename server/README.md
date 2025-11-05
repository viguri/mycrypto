# MyCrypto Server

This directory contains the backend server implementation for the MyCrypto blockchain application.

## Directory Structure

- `api/`: API endpoints and middleware
  - `middlewares/`: Express middleware (error handling, validation, etc.)
  - `routes/`: API route handlers organized by domain
  - `validators/`: Request validation schemas

- `blockchain/`: Core blockchain implementation
  - `core/`: Core blockchain classes (Block, Blockchain)
  - `transactions/`: Transaction handling

- `services/`: Business logic services
  - `CryptoService.js`: Cryptographic operations

- `storage/`: Data persistence
  - `blockchain/`: Blockchain storage
  - `wallets/`: Wallet storage

- `utils/`: Utility functions
  - `logger/`: Advanced logging system with compression and indexing
  - `memory/`: Memory management utilities
  - `response/`: Response formatting utilities

- `config/`: Configuration files for different environments

## Getting Started

To run the server:

```bash
# Development mode
npm run dev

# Production mode
npm run start
```

## API Endpoints

The server exposes the following API endpoints:

- `/api/v1/registration`: Wallet registration
- `/api/v1/transactions`: Transaction management
- `/api/v1/mining`: Mining operations
- `/api/v1/blockchain`: Blockchain information
- `/api/v1/logs`: Log management
