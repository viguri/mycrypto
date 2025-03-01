#!/bin/bash
# Test script for blockchain API endpoints

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

BASE_URL="http://localhost:3000/api"

# Helper functions
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
        if [ ! -z "$3" ]; then
            echo "  Response: $3"
        fi
    else
        echo -e "${RED}✗ $2${NC}"
        if [ ! -z "$3" ]; then
            echo -e "${RED}  Error: $3${NC}"
        fi
    fi
}

print_header() {
    echo -e "\n${YELLOW}=== $1 ===${NC}"
}

# Test Registration API
print_header "Testing Registration API"

# Create new wallet
echo "Creating wallet 1..."
WALLET1_RESPONSE=$(curl -s -X POST "${BASE_URL}/register/wallet")
WALLET1_ADDRESS=$(echo $WALLET1_RESPONSE | jq -r '.wallet.address')
print_result $? "Create wallet 1" "$WALLET1_RESPONSE"

# Create second wallet
echo "Creating wallet 2..."
WALLET2_RESPONSE=$(curl -s -X POST "${BASE_URL}/register/wallet")
WALLET2_ADDRESS=$(echo $WALLET2_RESPONSE | jq -r '.wallet.address')
print_result $? "Create wallet 2" "$WALLET2_RESPONSE"

# Get wallet info
echo "Getting wallet 1 info..."
WALLET1_INFO=$(curl -s "${BASE_URL}/register/${WALLET1_ADDRESS}")
print_result $? "Get wallet 1 info" "$WALLET1_INFO"

# Get all wallets
echo "Getting all wallets..."
ALL_WALLETS=$(curl -s "${BASE_URL}/register/wallets")
print_result $? "Get all wallets" "$ALL_WALLETS"

# Test Transaction API
print_header "Testing Transaction API"

# Create transaction
echo "Creating transaction..."
TX_RESPONSE=$(curl -s -X POST "${BASE_URL}/transactions" \
    -H "Content-Type: application/json" \
    -d "{
        \"from\": \"${WALLET1_ADDRESS}\",
        \"to\": \"${WALLET2_ADDRESS}\",
        \"amount\": 50
    }")
print_result $? "Create transaction" "$TX_RESPONSE"
TX_HASH=$(echo $TX_RESPONSE | jq -r '.transaction.hash')

# Get pending transactions
echo "Getting pending transactions..."
PENDING_TX=$(curl -s "${BASE_URL}/transactions/pending")
print_result $? "Get pending transactions" "$PENDING_TX"

# Get specific transaction
echo "Getting transaction details..."
TX_INFO=$(curl -s "${BASE_URL}/transactions/${TX_HASH}")
print_result $? "Get transaction info" "$TX_INFO"

# Get wallet transactions
echo "Getting wallet transactions..."
WALLET_TX=$(curl -s "${BASE_URL}/transactions/wallet/${WALLET1_ADDRESS}")
print_result $? "Get wallet transactions" "$WALLET_TX"

# Test Mining API
print_header "Testing Mining API"

# Mine pending transactions
echo "Mining transactions..."
MINE_RESPONSE=$(curl -s -X POST "${BASE_URL}/mining/mine")
print_result $? "Mine transactions" "$MINE_RESPONSE"

# Verify balances after mining
echo "Verifying wallet balances after mining..."
WALLET1_FINAL=$(curl -s "${BASE_URL}/register/${WALLET1_ADDRESS}")
WALLET2_FINAL=$(curl -s "${BASE_URL}/register/${WALLET2_ADDRESS}")

WALLET1_BALANCE=$(echo $WALLET1_FINAL | jq -r '.balance')
WALLET2_BALANCE=$(echo $WALLET2_FINAL | jq -r '.balance')

echo "Wallet 1 balance: $WALLET1_BALANCE"
echo "Wallet 2 balance: $WALLET2_BALANCE"

# Test Blockchain API
print_header "Testing Blockchain API"

# Get blockchain info
echo "Getting blockchain info..."
CHAIN_INFO=$(curl -s "${BASE_URL}/blockchain")
print_result $? "Get blockchain info" "$CHAIN_INFO"

# Get blockchain stats
echo "Getting blockchain stats..."
STATS_INFO=$(curl -s "${BASE_URL}/blockchain/stats")
print_result $? "Get blockchain stats" "$STATS_INFO"

# Get specific block
echo "Getting genesis block..."
BLOCK_INFO=$(curl -s "${BASE_URL}/blockchain/block/0")
print_result $? "Get block info" "$BLOCK_INFO"

# Summary
print_header "Test Summary"
BLOCK_COUNT=$(echo $CHAIN_INFO | jq -r '.stats.blockCount')
WALLET_COUNT=$(echo $CHAIN_INFO | jq -r '.stats.walletCount')
PENDING_COUNT=$(echo $CHAIN_INFO | jq -r '.stats.pendingCount')

echo "Total blocks: $BLOCK_COUNT"
echo "Total wallets: $WALLET_COUNT"
echo "Pending transactions: $PENDING_COUNT"