# VigCoin

A simple blockchain cryptocurrency implementation built with Node.js. This project demonstrates the basic concepts of blockchain technology and cryptocurrency.

## Features

- Proof-of-work blockchain implementation
- Transaction management system
- Mining rewards system
- REST API for blockchain interaction
- Web-based interface for easy interaction
- Balance checking functionality

## Technical Stack

- Backend: Node.js with Express
- Frontend: HTML, CSS, JavaScript
- Cryptography: Node.js crypto module
- Package Manager: Yarn

## Project Structure

```
vigcoin/
├── src/
│   ├── blockchain.js    # Core blockchain implementation
│   ├── server.js        # REST API server
│   └── index.html       # Web interface
└── package.json         # Project configuration
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

## Usage

1. Start the server:

```bash
yarn start
```

2. Open `src/index.html` in your web browser to access the web interface.

## API Endpoints

The server runs on `http://localhost:3000` and provides the following endpoints:

- `GET /blockchain` - Get the entire blockchain
- `POST /transaction` - Create a new transaction
  ```json
  {
    "fromAddress": "address1",
    "toAddress": "address2",
    "amount": 50
  }
  ```
- `POST /mine` - Mine a new block
  ```json
  {
    "minerAddress": "minerAddress"
  }
  ```
- `GET /balance/:address` - Get the balance of a specific address

## Web Interface Features

1. **Create Transaction**

   - Enter sender's address
   - Enter recipient's address
   - Specify amount to send
   - Submit transaction

2. **Mine Block**

   - Enter miner's address
   - Mine new block (includes mining reward)

3. **Check Balance**

   - Enter address to check
   - View current balance

4. **Blockchain Viewer**
   - View entire blockchain
   - Refresh to see updates

## Technical Details

### Block Structure

Each block contains:

- Timestamp
- Transactions array
- Previous block's hash
- Current block's hash
- Nonce (for proof-of-work)

### Mining Process

- Proof-of-work system
- Difficulty level: 2 (number of leading zeros required in hash)
- Mining reward: 100 VigCoins
- Automatic verification of chain integrity

### Transaction System

- Tracks sender and recipient addresses
- Maintains transaction amounts
- Validates transaction data
- Manages pending transactions

## Security Considerations

This is a basic implementation for educational purposes. In a production environment, you would need to consider:

- Private key/public key cryptography
- Secure wallet implementation
- Peer-to-peer networking
- Transaction verification
- Network consensus mechanisms
- Protection against various blockchain attacks

## License

MIT License (or specify your chosen license)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
