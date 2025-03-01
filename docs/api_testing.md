# API Testing Documentation

This document provides comprehensive testing instructions for all API endpoints in the VigCoin system.

## Registration Endpoints

### Create New Wallet

Creates a new wallet in the blockchain system.

```bash
curl -X POST http://localhost:3000/api/register/wallet \
     -H "Content-Type: application/json"
```

Expected Response (200 OK):

```json
{
  "message": "Wallet registered successfully",
  "wallet": {
    "address": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
    "balance": 1000,
    "createdAt": 1740682000000
  }
}
```

### List All Wallets

Retrieves all wallets registered in the system.

```bash
curl -X GET http://localhost:3000/api/register/wallets
```

Expected Response (200 OK):

```json
{
  "wallets": [
    {
      "address": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
      "balance": 1000,
      "createdAt": 1740682000000,
      "transactionCount": 0
    }
  ],
  "count": 1
}
```

### Get Specific Wallet Info

Retrieves details for a specific wallet.

```bash
curl -X GET http://localhost:3000/api/register/6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7
```

Expected Response (200 OK):

```json
{
  "address": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
  "balance": 1000,
  "transactionCount": 0,
  "createdAt": 1740682000000
}
```

## Transaction Endpoints

### Create Transaction

Sends coins from one wallet to another.

```bash
curl -X POST http://localhost:3000/api/transactions \
     -H "Content-Type: application/json" \
     -d '{
       "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
       "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
       "amount": 50
     }'
```

Expected Response (201 Created):

```json
{
  "message": "Transaction created successfully",
  "transaction": {
    "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
    "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
    "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
    "amount": 50,
    "timestamp": 1740682000000
  }
}
```

### List Pending Transactions

Retrieves all transactions that haven't been mined yet.

```bash
curl -X GET http://localhost:3000/api/transactions/pending
```

Expected Response (200 OK):

```json
{
  "count": 1,
  "transactions": [
    {
      "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
      "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
      "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
      "amount": 50,
      "timestamp": 1740682000000
    }
  ]
}
```

### Get Wallet Transactions

Retrieves all transactions (pending and confirmed) for a specific wallet.

```bash
curl -X GET http://localhost:3000/api/transactions/wallet/6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7
```

Expected Response (200 OK):

```json
[
  {
    "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
    "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
    "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
    "amount": 50,
    "timestamp": 1740682000000,
    "status": "pending"
  }
]
```

### Get Specific Transaction

Retrieves details for a specific transaction.

```bash
curl -X GET http://localhost:3000/api/transactions/8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b
```

Expected Response (200 OK):

```json
{
  "hash": "8f7d0e1e5b1e7c7e3b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b1b",
  "from": "6403230f5e3b8a31f7b01d1314f3ea7dfcd42813981f395035b7ef7ffcf401e7",
  "to": "107320dd7da72165ac3c22018c9bd38323c71e7af7a86e0dbde2f1e4371f8ad3",
  "amount": 50,
  "timestamp": 1740682000000,
  "status": "pending"
}
```

## Blockchain Status

### Get Blockchain Info

Retrieves current blockchain status.

```bash
curl -X GET http://localhost:3000/api/blockchain
```

Expected Response (200 OK):

```json
{
  "blocks": 1,
  "pendingTransactions": 1,
  "wallets": 2,
  "genesisHash": "630052aeb99387d254800d2177121905502f76903c1f91efb2edd1aa5d7839b7"
}
```

## Testing Sequence

1. First create two wallets using the Create New Wallet endpoint
2. Verify the wallets were created using List All Wallets
3. Check individual wallet details using Get Specific Wallet Info
4. Create a transaction between the wallets
5. Verify the transaction appears in the pending list
6. Check both wallets' transaction histories
7. Look up the specific transaction details
8. Monitor the blockchain status throughout the process

## Error Cases

All endpoints include proper error handling. Common error responses:

### Not Found (404):

```json
{
  "error": "NotFound",
  "message": "Wallet not found"
}
```

### Bad Request (400):

```json
{
  "error": "TransactionError",
  "message": "Insufficient balance"
}
```

### Server Error (500):

```json
{
  "error": "ServerError",
  "message": "Internal server error"
}
```
