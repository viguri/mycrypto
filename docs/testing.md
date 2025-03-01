# Testing Guide

## Overview

VigCoin implements comprehensive testing across multiple layers:

- Unit Tests
- Integration Tests
- End-to-End Tests
- Security Tests
- Performance Tests

## Test Structure

```
tests/
├── unit/
│   ├── blockchain/
│   │   ├── Block.test.js
│   │   ├── Transaction.test.js
│   │   └── Blockchain.test.js
│   └── services/
│       └── CryptoService.test.js
├── integration/
│   ├── api/
│   │   ├── blockchain.test.js
│   │   ├── transactions.test.js
│   │   └── mining.test.js
│   └── middleware/
│       ├── validation.test.js
│       └── errorHandler.test.js
└── e2e/
    └── api.test.js
```

## Unit Tests

### Blockchain Components

#### Block Tests

```javascript
const Block = require("../../src/blockchain/Block");
const Transaction = require("../../src/blockchain/Transaction");

describe("Block", () => {
  let block;
  let transactions;

  beforeEach(() => {
    transactions = [new Transaction("address1", "address2", 100)];
    block = new Block(Date.now(), transactions, "0000");
  });

  test("should calculate correct hash", () => {
    const hash = block.calculateHash();
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  test("should mine block at given difficulty", () => {
    const difficulty = 2;
    block.mineBlock(difficulty);
    expect(block.hash.substring(0, difficulty)).toBe("0".repeat(difficulty));
  });

  test("should validate merkle root", () => {
    const merkleRoot = block.calculateMerkleRoot();
    expect(merkleRoot).toBeTruthy();
    expect(block.merkleRoot).toBe(merkleRoot);
  });
});
```

#### Transaction Tests

```javascript
const Transaction = require("../../src/blockchain/Transaction");
const CryptoService = require("../../src/services/CryptoService");

describe("Transaction", () => {
  let wallet;
  let transaction;

  beforeEach(() => {
    wallet = CryptoService.generateKeypair();
    transaction = new Transaction("sender", "recipient", 100);
  });

  test("should sign transaction correctly", () => {
    transaction.sign(wallet.privateKey, wallet.publicKey);
    expect(transaction.signature).toBeTruthy();
  });

  test("should verify valid signature", () => {
    transaction.sign(wallet.privateKey, wallet.publicKey);
    expect(transaction.isValid(wallet.publicKey)).toBe(true);
  });

  test("should reject invalid signature", () => {
    const fakeWallet = CryptoService.generateKeypair();
    transaction.sign(fakeWallet.privateKey, fakeWallet.publicKey);
    expect(transaction.isValid(wallet.publicKey)).toBe(false);
  });
});
```

### Service Tests

#### CryptoService Tests

```javascript
const CryptoService = require("../../src/services/CryptoService");

describe("CryptoService", () => {
  test("should generate valid keypair", () => {
    const keypair = CryptoService.generateKeypair();
    expect(keypair.publicKey).toMatch(/^-----BEGIN PUBLIC KEY-----/);
    expect(keypair.privateKey).toMatch(/^-----BEGIN PRIVATE KEY-----/);
  });

  test("should generate valid address", () => {
    const keypair = CryptoService.generateKeypair();
    const address = CryptoService.generateAddress(keypair.publicKey);
    expect(address).toMatch(/^[a-f0-9]{40}$/);
  });

  test("should sign and verify data", () => {
    const keypair = CryptoService.generateKeypair();
    const data = { test: "data" };
    const signature = CryptoService.signTransaction(keypair.privateKey, data);
    expect(
      CryptoService.verifySignature(keypair.publicKey, data, signature)
    ).toBe(true);
  });
});
```

## Integration Tests

### API Endpoints

```javascript
const request = require("supertest");
const app = require("../../src/server");

describe("Blockchain API", () => {
  test("GET /blockchain should return chain", async () => {
    const response = await request(app)
      .get("/blockchain")
      .expect("Content-Type", /json/)
      .expect(200);

    expect(response.body).toHaveProperty("chain");
    expect(Array.isArray(response.body.chain)).toBe(true);
  });

  test("POST /transactions should add transaction", async () => {
    const wallet = CryptoService.generateKeypair();
    const address = CryptoService.generateAddress(wallet.publicKey);

    const tx = {
      fromAddress: address,
      toAddress: "recipient",
      amount: 100,
    };

    const signature = CryptoService.signTransaction(wallet.privateKey, tx);

    const response = await request(app)
      .post("/transactions")
      .send({ ...tx, signature })
      .expect("Content-Type", /json/)
      .expect(201);

    expect(response.body.message).toBe("Transaction added successfully");
  });
});
```

### Middleware Tests

```javascript
describe("Validation Middleware", () => {
  test("should validate correct transaction", async () => {
    const validTx = {
      fromAddress: "0".repeat(40),
      toAddress: "1".repeat(40),
      amount: 100,
      signature: "valid",
    };

    const response = await request(app)
      .post("/transactions")
      .send(validTx)
      .expect(201);
  });

  test("should reject invalid transaction", async () => {
    const invalidTx = {
      fromAddress: "invalid",
      amount: -100,
    };

    const response = await request(app)
      .post("/transactions")
      .send(invalidTx)
      .expect(400);

    expect(response.body).toHaveProperty("error");
  });
});
```

## End-to-End Tests

```javascript
describe("E2E Tests", () => {
  test("Complete transaction flow", async () => {
    // 1. Generate wallet
    const wallet = CryptoService.generateKeypair();
    const address = CryptoService.generateAddress(wallet.publicKey);

    // 2. Create transaction
    const tx = {
      fromAddress: address,
      toAddress: "recipient",
      amount: 100,
    };

    const signature = CryptoService.signTransaction(wallet.privateKey, tx);

    // 3. Submit transaction
    await request(app)
      .post("/transactions")
      .send({ ...tx, signature })
      .expect(201);

    // 4. Mine block
    await request(app)
      .post("/mine")
      .send({ minerAddress: address })
      .expect(201);

    // 5. Verify balance
    const response = await request(app)
      .get(`/transactions/balance/${address}`)
      .expect(200);

    expect(response.body.balance).toBe(100); // Mining reward
  });
});
```

## Performance Tests

```javascript
describe("Performance Tests", () => {
  test("should handle multiple transactions", async () => {
    const start = Date.now();
    const transactions = Array(100)
      .fill()
      .map(() => ({
        fromAddress: "0".repeat(40),
        toAddress: "1".repeat(40),
        amount: 100,
        signature: "valid",
      }));

    await Promise.all(
      transactions.map((tx) => request(app).post("/transactions").send(tx))
    );

    const duration = Date.now() - start;
    expect(duration).toBeLessThan(5000); // 5 seconds max
  });
});
```

## Running Tests

### Commands

```bash
# Run all tests
yarn test

# Run specific test file
yarn test tests/unit/blockchain/Block.test.js

# Run with coverage
yarn test --coverage

# Run in watch mode
yarn test --watch

# Run specific test suite
yarn test -t "Block"
```

### CI/CD Integration

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: yarn install
      - run: yarn test
      - run: yarn test:coverage
```

## Code Coverage

Aim for:

- Statements: >90%
- Branches: >85%
- Functions: >90%
- Lines: >90%

## Testing Best Practices

1. **Test Organization**

   - Group related tests
   - Use descriptive names
   - Follow AAA pattern (Arrange, Act, Assert)

2. **Test Independence**

   - Reset state between tests
   - No test dependencies
   - Clean up after tests

3. **Coverage**

   - Test edge cases
   - Include error scenarios
   - Test boundary conditions

4. **Maintenance**
   - Keep tests simple
   - Don't duplicate test logic
   - Update tests with code changes
