# Docker CLI Guide for VigCoin

This guide explains how to run the VigCoin CLI using Docker.

## Quick Start

### Option 1: Using Docker Directly

1. Build the CLI image:

```bash
docker build -t vigcoin-cli -f Dockerfile.cli .
```

2. Run CLI commands:

```bash
# Create a new wallet
docker run --network="host" vigcoin-cli create-wallet

# List all wallets
docker run --network="host" vigcoin-cli list-wallets

# Send VIG tokens
docker run --network="host" vigcoin-cli send <from-address> <to-address> 100

# Mine pending transactions
docker run --network="host" vigcoin-cli mine
```

### Option 2: Using Docker Compose (Recommended)

1. Start the blockchain server:

```bash
docker-compose -f docker-compose.cli.yml up -d server
```

2. Wait a few seconds for the server to be ready (health check will ensure this)

3. Run CLI commands:

```bash
# Create a new wallet
docker-compose -f docker-compose.cli.yml run --rm cli create-wallet

# List all wallets
docker-compose -f docker-compose.cli.yml run --rm cli list-wallets

# Send VIG tokens
docker-compose -f docker-compose.cli.yml run --rm cli send <from-address> <to-address> 100

# Mine pending transactions
docker-compose -f docker-compose.cli.yml run --rm cli mine
```

4. When finished, stop the server:

```bash
docker-compose -f docker-compose.cli.yml down
```

## Step-by-Step Example

Here's a complete workflow example using Docker Compose:

1. Start the server:

```bash
docker-compose -f docker-compose.cli.yml up -d server
```

2. Create two wallets:

```bash
# Create first wallet and note its address
docker-compose -f docker-compose.cli.yml run --rm cli create-wallet

# Create second wallet and note its address
docker-compose -f docker-compose.cli.yml run --rm cli create-wallet
```

3. List all wallets to verify they were created:

```bash
docker-compose -f docker-compose.cli.yml run --rm cli list-wallets
```

4. Send VIG tokens between wallets:

```bash
docker-compose -f docker-compose.cli.yml run --rm cli send <first-wallet-address> <second-wallet-address> 500
```

5. Check updated balances:

```bash
# Check first wallet
docker-compose -f docker-compose.cli.yml run --rm cli wallet <first-wallet-address>

# Check second wallet
docker-compose -f docker-compose.cli.yml run --rm cli wallet <second-wallet-address>
```

6. Clean up when done:

```bash
docker-compose -f docker-compose.cli.yml down
```

## Troubleshooting

### Common Issues

1. Can't connect to server:

```bash
# Check server logs
docker-compose -f docker-compose.cli.yml logs server

# Restart server if needed
docker-compose -f docker-compose.cli.yml restart server
```

2. Network issues:

- Ensure you're using `--network="host"` when running with plain Docker
- For Docker Compose, the networking is handled automatically

3. Data persistence:

- Blockchain data is stored in `./src/storage`
- Logs are stored in `./logs`
- These directories are mounted as volumes

### Custom API URL

If your server is running on a different host or port:

```bash
# Using Docker
docker run --network="host" -e API_URL=http://custom-host:3000/api vigcoin-cli list-wallets

# Using Docker Compose
API_URL=http://custom-host:3000/api docker-compose -f docker-compose.cli.yml run --rm cli list-wallets
```

## Maintenance

- Keep your images updated:

```bash
docker-compose -f docker-compose.cli.yml build --no-cache
```

- Clean up unused containers and images:

```bash
docker-compose -f docker-compose.cli.yml down --rmi all
```

## Server Commands

View server status:

```bash
# Check running containers
docker-compose -f docker-compose.cli.yml ps

# View logs
docker-compose -f docker-compose.cli.yml logs -f server
```
