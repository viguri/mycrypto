# VigCoin CLI Manual

## Overview

The VigCoin CLI is a command-line interface for interacting with the VigCoin blockchain. It provides easy access to common operations like creating wallets, sending transactions, and mining blocks.

## Prerequisites

Before using the CLI, ensure that:

1. The VigCoin server is running (`yarn dev:all`)
2. The API is accessible at http://localhost:3000

## Docker Support

You can also run the CLI using Docker, which is useful for testing or when you don't want to install Node.js locally.

### Building the Docker Image

```bash
docker build -t vigcoin-cli -f Dockerfile.cli .
```

### Running CLI Commands with Docker

The general format for running commands is:

```bash
docker run --network="host" vigcoin-cli [command]
```

Examples:

```bash
# Create a new wallet
docker run --network="host" vigcoin-cli create-wallet

# List all wallets
docker run --network="host" vigcoin-cli list-wallets
```

### Using Docker Compose

For a more integrated setup that includes both the server and CLI, you can use Docker Compose:

1. Start the server:

```bash
docker-compose -f docker-compose.cli.yml up -d server
```

2. Wait for the server to be healthy (the healthcheck will ensure this)

3. Run CLI commands:

```bash
# Create wallet
docker-compose -f docker-compose.cli.yml run --rm cli create-wallet

# List wallets
docker-compose -f docker-compose.cli.yml run --rm cli list-wallets

# Send transaction
docker-compose -f docker-compose.cli.yml run --rm cli send <from> <to> <amount>
```

4. When finished, stop the server:

```bash
docker-compose -f docker-compose.cli.yml down
```

Note: The docker-compose setup includes volume mounts for logs and blockchain storage, ensuring data persistence between runs.

## Commands

### Create a New Wallet

Creates a new wallet with an initial balance of VIG tokens.

```bash
yarn cli create-wallet
```

Example output:

```
Wallet created successfully! 🎉
Address: 7f8e9d2c...
Initial Balance: 1000 VIG
```

### View Wallet Information

Retrieves detailed information about a specific wallet.

```bash
yarn cli wallet <address>
```

Parameters:

- `address`: The wallet address to query

Example:

```bash
yarn cli wallet 7f8e9d2c...
```

The output includes:

- Wallet address
- Current balance
- Creation date
- Number of transactions

### List All Wallets

Displays a table of all wallets in the system.

```bash
yarn cli list-wallets
```

The output shows:

- Wallet addresses
- Current balances
- Creation dates

### Send VIG Tokens

Transfers VIG tokens from one wallet to another.

```bash
yarn cli send <from> <to> <amount>
```

Parameters:

- `from`: Source wallet address
- `to`: Destination wallet address
- `amount`: Amount of VIG to send

Example:

```bash
yarn cli send 7f8e9d2c... 3a4b5c6d... 100
```

Notes:

- The transaction will be automatically mined
- Ensure the source wallet has sufficient balance

### Mine Pending Transactions

Manually mines any pending transactions into a new block.

```bash
yarn cli mine
```

The output shows:

- Block hash
- Number of transactions mined

## Example Workflow

1. Create two wallets:

```bash
yarn cli create-wallet
# Save the first address
yarn cli create-wallet
# Save the second address
```

2. View all wallets:

```bash
yarn cli list-wallets
```

3. Send VIG from first wallet to second:

```bash
yarn cli send <first-address> <second-address> 500
```

4. Check updated balances:

```bash
yarn cli wallet <first-address>
yarn cli wallet <second-address>
```

## Troubleshooting

1. If commands fail with connection errors:

   - Ensure the server is running (`yarn dev:all`)
   - Check if the API is accessible at http://localhost:3000

2. If transactions fail:

   - Verify the source wallet has sufficient balance
   - Ensure wallet addresses are correct
   - Check if the server is synced

3. If mining fails:
   - Ensure there are pending transactions
   - Check server connectivity

### Docker-Specific Troubleshooting

1. If the CLI can't connect to the API:

   - Ensure you're using `--network="host"` in the Docker run command
   - Verify the API URL is correct (default: http://localhost:3000)
   - You can override the API URL using the environment variable:
     ```bash
     docker run --network="host" -e API_URL=http://your-api-url:3000/api vigcoin-cli [command]
     ```

2. When using docker-compose:
   - Check server logs: `docker-compose -f docker-compose.cli.yml logs server`
   - Ensure the server is healthy before running CLI commands
   - If the server container is not healthy, check the logs for errors
