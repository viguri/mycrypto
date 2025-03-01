#!/bin/bash

# VigCoin API Test Script
# Usage: 
#   1. Make sure the backend server is running (cd src && node server.js)
#   2. Make this script executable: chmod +x api_test.sh
#   3. Run the script: ./api_test.sh
#
# Requirements:
#   - curl
#   - jq (for JSON formatting)
#
# To install jq:
#   - Mac: brew install jq
#   - Ubuntu/Debian: sudo apt-get install jq
#   - Windows: choco install jq

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Base URL
API_URL="http://localhost:3000"

echo -e "${BLUE}Starting API tests...${NC}\n"

# Function to print test step
print_step() {
    echo -e "\n${GREEN}=== $1 ===${NC}"
}

# Function to store command output
store_output() {
    echo "$1" > .temp_output
}

# Create first wallet
print_step "Creating first wallet"
WALLET1=$(curl -s -X POST "$API_URL/api/register/wallet" \
     -H "Content-Type: application/json" | jq -r '.wallet.address')
echo "Wallet 1 address: $WALLET1"

sleep 1

# Create second wallet
print_step "Creating second wallet"
WALLET2=$(curl -s -X POST "$API_URL/api/register/wallet" \
     -H "Content-Type: application/json" | jq -r '.wallet.address')
echo "Wallet 2 address: $WALLET2"

sleep 1

# List all wallets
print_step "Listing all wallets"
curl -s -X GET "$API_URL/api/register/wallets" | jq

sleep 1

# Get first wallet details
print_step "Getting Wallet 1 details"
curl -s -X GET "$API_URL/api/register/$WALLET1" | jq

sleep 1

# Get second wallet details
print_step "Getting Wallet 2 details"
curl -s -X GET "$API_URL/api/register/$WALLET2" | jq

sleep 1

# Send transaction from wallet1 to wallet2
print_step "Creating transaction from Wallet 1 to Wallet 2"
TX=$(curl -s -X POST "$API_URL/api/transactions" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "'$WALLET1'",
       "to": "'$WALLET2'",
       "amount": 50
     }' | jq -r '.transaction.hash')
echo "Transaction hash: $TX"

sleep 1

# Get pending transactions
print_step "Getting pending transactions"
curl -s -X GET "$API_URL/api/transactions/pending" | jq

sleep 1

# Get wallet1 transactions
print_step "Getting Wallet 1 transactions"
curl -s -X GET "$API_URL/api/transactions/wallet/$WALLET1" | jq

sleep 1

# Get wallet2 transactions
print_step "Getting Wallet 2 transactions"
curl -s -X GET "$API_URL/api/transactions/wallet/$WALLET2" | jq

sleep 1

# Get specific transaction
print_step "Getting transaction details"
curl -s -X GET "$API_URL/api/transactions/$TX" | jq

sleep 1

# Get blockchain status
print_step "Getting blockchain status"
curl -s -X GET "$API_URL/api/blockchain" | jq

sleep 1

# Error case tests
print_step "Testing error cases"

echo -e "\nTesting non-existent wallet:"
curl -s -X GET "$API_URL/api/register/nonexistentwallet" | jq

echo -e "\nTesting invalid transaction (insufficient balance):"
curl -s -X POST "$API_URL/api/transactions" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "'$WALLET1'",
       "to": "'$WALLET2'",
       "amount": 999999
     }' | jq

echo -e "\n${BLUE}API tests completed${NC}"