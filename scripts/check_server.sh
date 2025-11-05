#!/bin/bash

# Check server configuration for MyCrypto application
echo "Checking server configuration for crypto.viguri.org..."

# Check if the server is reachable
echo "Testing server reachability..."
curl -I https://crypto.viguri.org

# Check if the Docker containers are running
echo "Checking Docker containers on the server..."
ssh viguri@81.169.168.33 "docker ps | grep cryptoviguriorg"

# Check if the Node.js server is responding
echo "Testing Node.js server directly..."
ssh viguri@81.169.168.33 "curl -s http://localhost:3003/api/test"

# Check the Plesk configuration
echo "Checking Plesk configuration..."
ssh viguri@81.169.168.33 "ls -la /var/www/vhosts/viguri.org/crypto.viguri.org/conf/"

echo "Check completed. If you need to fix the server configuration, run:"
echo "./scripts/fix_api.sh"
