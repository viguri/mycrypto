#!/bin/bash
# Test script for MyCrypto server
# This script tests key endpoints to verify server functionality

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SERVER_URL="http://localhost:3003"
TEST_WALLET_ADDRESS=""
TEST_RESULTS=()

echo -e "${YELLOW}Starting MyCrypto Server Test Suite${NC}"
echo "Testing server at $SERVER_URL"
echo "--------------------------------------"

# Function to run a test and record the result
run_test() {
  local test_name=$1
  local command=$2
  local expected_status=$3
  
  echo -e "\n${YELLOW}Running test: $test_name${NC}"
  echo "Command: $command"
  
  # Run the command and capture output and status
  local output
  local status
  output=$(eval $command 2>&1)
  status=$?
  
  # Check if the command succeeded based on expected status
  if [ $status -eq $expected_status ]; then
    echo -e "${GREEN}✓ Test passed${NC}"
    TEST_RESULTS+=("✓ $test_name")
  else
    echo -e "${RED}✗ Test failed (exit code: $status)${NC}"
    echo -e "${RED}Output: $output${NC}"
    TEST_RESULTS+=("✗ $test_name")
  fi
  
  # Return the output for further processing if needed
  echo "$output"
}

# Start the server in the background
echo -e "\n${YELLOW}Starting MyCrypto server...${NC}"
cd /Users/viguri/GitHub/mycrypto
mkdir -p logs/archive server/logs/archive
touch logs/app.log server/logs/app.log
chmod -R 777 logs server/logs

# Start server with environment variables
NODE_ENV=production PORT=3003 LOG_LEVEL=info node server/server.js > server_test.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start (10 seconds)..."
sleep 10

# Test 1: Check if server is running
test_output=$(run_test "Server Health Check" "curl -s -o /dev/null -w '%{http_code}' $SERVER_URL/test" 0)
if [[ $test_output == *"200"* ]]; then
  echo "Server is running correctly"
else
  echo -e "${RED}Server is not responding correctly. Aborting tests.${NC}"
  kill $SERVER_PID
  exit 1
fi

# Test 2: Test API endpoint
run_test "API Test Endpoint" "curl -s $SERVER_URL/api/test | grep 'successful'" 0

# Test 3: Create a new wallet
wallet_response=$(run_test "Create Wallet" "curl -s -X POST $SERVER_URL/api/registration/wallet -H 'Content-Type: application/json'" 0)
echo "Wallet creation response: $wallet_response"

# Extract wallet address from response
TEST_WALLET_ADDRESS=$(echo $wallet_response | grep -o '"address":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TEST_WALLET_ADDRESS" ]; then
  echo "Created test wallet with address: $TEST_WALLET_ADDRESS"
else
  echo -e "${RED}Failed to extract wallet address from response${NC}"
fi

# Test 4: Get wallet information
if [ -n "$TEST_WALLET_ADDRESS" ]; then
  run_test "Get Wallet Info" "curl -s $SERVER_URL/api/registration/$TEST_WALLET_ADDRESS | grep 'address'" 0
fi

# Test 5: List all wallets
run_test "List All Wallets" "curl -s $SERVER_URL/api/registration/wallets | grep -E 'count|success'" 0

# Test 6: Get blockchain info
run_test "Get Blockchain Info" "curl -s $SERVER_URL/api/blockchain | grep -E 'chain|stats|blockCount'" 0

# Test 7: Check logs API (from the enhanced logging system)
run_test "Logs API" "curl -s $SERVER_URL/api/logs | grep -v 'Cannot GET'" 0

# Stop the server
echo -e "\n${YELLOW}Stopping MyCrypto server...${NC}"
kill $SERVER_PID

# Print test summary
echo -e "\n${YELLOW}Test Summary:${NC}"
for result in "${TEST_RESULTS[@]}"; do
  if [[ $result == "✓"* ]]; then
    echo -e "${GREEN}$result${NC}"
  else
    echo -e "${RED}$result${NC}"
  fi
done

# Check if all tests passed
if [[ "${TEST_RESULTS[@]}" != *"✗"* ]]; then
  echo -e "\n${GREEN}All tests passed! The server is ready for deployment.${NC}"
else
  echo -e "\n${RED}Some tests failed. Please review the issues before deployment.${NC}"
fi

echo -e "\n${YELLOW}Server logs are available in server_test.log${NC}"
