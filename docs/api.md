# API Documentation

## Core Components

### CryptoService

Located in `src/services/CryptoService.js`

Handles all cryptographic operations for the blockchain.

#### Methods

##### `generateKeypair()`

Generates a new RSA keypair for wallet creation.

- Returns: `Object`
  - `publicKey`: PEM formatted public key
  - `privateKey`: PEM formatted private key

##### `signTransaction(privateKey, transaction)`

Signs a transaction with the given private key.

- Parameters:
  - `privateKey`: String - PEM formatted private key
  - `transaction`: Object - Transaction data
- Returns: String - Hexadecimal signature

##### `verifySignature(publicKey, transaction, signature)`

Verifies a transaction signature.

- Parameters:
  - `publicKey`: String - PEM formatted public key
  - `transaction`: Object - Transaction data
  - `signature`: String - Hexadecimal signature
- Returns: Boolean - Whether signature is valid

##### `hash(data)`

Generates SHA256 hash of data.

- Parameters:
  - `data`: String|Object - Data to hash
- Returns: String - Hexadecimal hash

##### `generateAddress(publicKey)`

Generates a wallet address from a public key.

- Parameters:
  - `publicKey`: String - PEM formatted public key
- Returns: String - Hexadecimal address

### Block

Located in `src/blockchain/Block.js`

Represents a block in the blockchain.

#### Constructor

- Parameters:
  - `timestamp`: Number - Block creation time
  - `transactions`: Array - List of transactions
  - `previousHash`: String - Hash of previous block

#### Properties

- `timestamp`: Number
- `transactions`: Array
- `previousHash`: String
- `hash`: String
- `nonce`: Number
- `merkleRoot`: String

#### Methods

##### `calculateHash()`

Calculates block hash including nonce.

- Returns: String - Block hash

##### `calculateMerkleRoot()`

Calculates Merkle root of transactions.

- Returns: String - Merkle root hash

##### `mineBlock(difficulty)`

Performs proof-of-work mining.

- Parameters:
  - `difficulty`: Number - Mining difficulty

##### `hasValidTransactions(publicKeys)`

Verifies all transactions in block.

- Parameters:
  - `publicKeys`: Map - Address to public key mapping
- Returns: Boolean

##### `isValid()`

Verifies block integrity.

- Returns: Boolean

### Transaction

Located in `src/blockchain/Transaction.js`

Represents a transaction in the blockchain.

#### Constructor

- Parameters:
  - `fromAddress`: String - Sender's address
  - `toAddress`: String - Recipient's address
  - `amount`: Number - Transaction amount

#### Properties

- `fromAddress`: String
- `toAddress`: String
- `amount`: Number
- `timestamp`: Number
- `signature`: String

#### Methods

##### `calculateHash()`

Calculates transaction hash.

- Returns: String - Transaction hash

##### `sign(signingKey, publicKey)`

Signs transaction with private key.

- Parameters:
  - `signingKey`: String - Private key
  - `publicKey`: String - Public key

##### `isValid(publicKey)`

Verifies transaction signature and validity.

- Parameters:
  - `publicKey`: String - Public key
- Returns: Boolean

### Blockchain

Located in `src/blockchain/Blockchain.js`

Main blockchain implementation.

#### Constructor

Creates new blockchain with genesis block.

#### Properties

- `chain`: Array - Blocks in chain
- `difficulty`: Number - Mining difficulty
- `pendingTransactions`: Array
- `miningReward`: Number
- `minTransactionAmount`: Number
- `maxTransactionAmount`: Number
- `publicKeys`: Map

#### Methods

##### `createGenesisBlock()`

Creates genesis block.

- Returns: Block

##### `getLatestBlock()`

Gets last block in chain.

- Returns: Block

##### `registerAddress(address, publicKey)`

Registers public key for address.

- Parameters:
  - `address`: String
  - `publicKey`: String

##### `addTransaction(transaction)`

Adds new transaction to pending.

- Parameters:
  - `transaction`: Transaction

##### `minePendingTransactions(miningRewardAddress)`

Mines new block with pending transactions.

- Parameters:
  - `miningRewardAddress`: String

##### `getBalanceOfAddress(address)`

Gets balance for address.

- Parameters:
  - `address`: String
- Returns: Number

##### `adjustDifficulty()`

Adjusts mining difficulty based on block times.

##### `isChainValid()`

Verifies entire blockchain.

- Returns: Boolean

## API Routes

### Blockchain Routes (`/blockchain`)

Located in `src/api/routes/blockchain.js`

#### GET /blockchain

Get entire blockchain state.

- Response: `{ chain, pendingTransactions, difficulty }`

#### GET /blockchain/validate

Validate chain integrity.

- Response: `{ valid, length }`

#### GET /blockchain/block/:index

Get specific block.

- Parameters:
  - `index`: Number
- Response: Block object

### Transaction Routes (`/transactions`)

Located in `src/api/routes/transactions.js`

#### POST /transactions

Create new transaction.

- Body:
  ```json
  {
    "fromAddress": "string",
    "toAddress": "string",
    "amount": "number",
    "signature": "string"
  }
  ```
- Response: `{ message, transaction }`

#### GET /transactions/pending

List pending transactions.

- Response: `{ count, transactions }`

#### GET /transactions/address/:address

Get transaction history for address.

- Parameters:
  - `address`: String
- Response: `{ address, transactions, balance }`

#### GET /transactions/balance/:address

Get balance for address.

- Parameters:
  - `address`: String
- Response: `{ address, balance }`

### Mining Routes (`/mine`)

Located in `src/api/routes/mining.js`

#### POST /mine

Mine new block.

- Body:
  ```json
  {
    "minerAddress": "string"
  }
  ```
- Response: `{ message, block, reward, difficulty }`

#### GET /mine/stats

Get mining statistics.

- Response: `{ difficulty, miningReward, pendingTransactionsCount, lastBlockHash }`

#### GET /mine/difficulty

Get mining difficulty details.

- Response: `{ currentDifficulty, targetPattern, lastBlockHash, avgBlockTime }`

## Middleware

### Validation

Located in `src/api/middlewares/validation.js`

Validates requests against Joi schemas.

#### validateRequest(schemaName)

Creates validation middleware.

- Parameters:
  - `schemaName`: String - Schema to validate against
- Returns: Express middleware

### Error Handler

Located in `src/api/middlewares/errorHandler.js`

Global error handling middleware.

#### Classes

##### BlockchainError

Custom error for blockchain operations.

- Constructor:
  - `message`: String
  - `statusCode`: Number (default: 400)

#### Functions

##### errorHandler(err, req, res, next)

Global error handling middleware.

##### asyncHandler(fn)

Wraps async route handlers.

- Parameters:
  - `fn`: Function - Route handler
- Returns: Express middleware
