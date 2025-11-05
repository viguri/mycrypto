#!/bin/bash
set -e

echo "Fixing client-side API URL configuration..."

# Create a backup of the original file
cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/wallet-manager.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/wallet-manager.js.bak

# Update the API base URL to use a relative URL
sed -i 's|this.apiBaseUrl = '\''http://localhost:3003/api'\'';|this.apiBaseUrl = '\''/api'\'';|g' /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/wallet-manager.js

echo "Checking other files for hardcoded API URLs..."

# Check app.js
if grep -q "localhost:3003" /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js; then
    echo "Fixing app.js..."
    cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js.bak
    sed -i 's|http://localhost:3003/api|/api|g' /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/app.js
fi

# Check connection-monitor.js
if grep -q "localhost:3003" /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js; then
    echo "Fixing connection-monitor.js..."
    cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js.bak
    sed -i 's|http://localhost:3003/api|/api|g' /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/connection-monitor.js
fi

# Check auth.js
if grep -q "localhost:3003" /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js; then
    echo "Fixing auth.js..."
    cp /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js.bak
    sed -i 's|http://localhost:3003/api|/api|g' /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/auth.js
fi

echo "Client-side API URL configuration fixed successfully!"
