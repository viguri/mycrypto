# VigCoin Wallet Guide

## Getting Started

To start using VigCoin, you need to:

1. Create a wallet (generates your keypair)
2. Register your address
3. Make transactions

### Create and Register Your Wallet

Run the create-wallet script:

```bash
node src/utils/create-wallet.js
```

This will:

- Generate a new public/private keypair
- Register your public key with the blockchain
- Show your wallet address
- Display your private key (save this securely!)

### Making Transactions

Once your wallet is registered, you can make transactions. To make a transaction, you need to:

1. Have your private key ready (saved from wallet creation)
2. Know the recipient's address
3. Sign the transaction with your private key

Example transaction using curl:

```bash
# First, sign the transaction (from the Node.js REPL):
> const CryptoService = require('./src/services/CryptoService')
> const tx = { fromAddress: 'your-address', toAddress: 'recipient-address', amount: 100 }
> const signature = CryptoService.signTransaction('your-private-key', tx)

# Then send the transaction:
curl -X POST http://localhost:3000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "fromAddress": "your-address",
    "toAddress": "recipient-address",
    "amount": 100,
    "signature": "generated-signature"
  }'
```

## Important Security Notes

1. Never share your private key
2. Always keep a secure backup of your private key
3. Once an address is registered, it cannot be changed
4. The signature proves you own the sending address

## Error Troubleshooting

- "Sender address not registered": You need to register your address first using the create-wallet script
- "Invalid transaction signature": Make sure you're using the correct private key to sign the transaction
- "Not enough balance": The sending address must have sufficient funds
