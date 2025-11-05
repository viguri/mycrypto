#!/bin/bash

echo "Testing API endpoints on crypto.viguri.org..."
echo "============================================="

# Test the main API endpoint
echo "Testing /api endpoint:"
curl -k -s -o /dev/null -w "%{http_code}" https://crypto.viguri.org/api
echo " <- HTTP status code"

# Test the test API endpoint
echo "Testing /api/test endpoint:"
curl -k -s -o /dev/null -w "%{http_code}" https://crypto.viguri.org/api/test
echo " <- HTTP status code"

# Test the registration/wallets API endpoint
echo "Testing /api/registration/wallets endpoint:"
curl -k -s -o /dev/null -w "%{http_code}" https://crypto.viguri.org/api/registration/wallets
echo " <- HTTP status code"

# Test the blockchain API endpoint
echo "Testing /api/blockchain endpoint:"
curl -k -s -o /dev/null -w "%{http_code}" https://crypto.viguri.org/api/blockchain
echo " <- HTTP status code"

# Test direct access to the Node.js server
echo "Testing direct access to Node.js server:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/api/test
echo " <- HTTP status code"

# Check if the Node.js server is running
echo "Checking if Node.js server is running:"
docker ps | grep cryptoviguriorg-server

# Check Docker logs
echo "Checking Docker logs (last 10 lines):"
docker logs cryptoviguriorg-server-1 --tail 10

echo "Done testing API endpoints."
