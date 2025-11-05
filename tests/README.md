# MyCrypto Tests

This directory contains all test files for the MyCrypto blockchain application, organized by test type and domain.

## Directory Structure

- `unit/`: Unit tests
  - `server/`: Server-side unit tests
    - `api/`: API endpoint tests
    - `blockchain/`: Blockchain implementation tests
    - `routes/`: Route handler tests
    - `memory/`: Memory management tests
    - `utils/`: Utility function tests
  - `client/`: Client-side unit tests
    - Component and utility tests

- `integration/`: Integration tests
  - End-to-end tests that verify multiple components working together

- `mocks/`: Mock data and mock implementations
  - `CryptoService.js`: Mock cryptographic service
  - `fetch.js`: Mock fetch implementation
  - `logger.js`: Mock logger
  - `mockData.js`: Common mock data used across tests

- `evidence/`: Test evidence and documentation
  - `blockchain-validation-testing.md`: Documentation of blockchain validation tests
  - `logs-api-testing.md`: Documentation of logging system tests

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run end-to-end tests
npm run test:e2e
```

## Test Setup

The `setup.js` file contains common setup code that runs before all tests, including:
- Environment configuration
- Mock initialization
- Global test utilities
