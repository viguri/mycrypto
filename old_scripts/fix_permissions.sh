#!/bin/bash
# Script to fix permissions on the server

echo "=== Fixing permissions for MyCrypto =="

# Create logs directory with proper permissions
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chown -R viguri:psaserv /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chmod -R 755 /var/www/vhosts/viguri.org/crypto.viguri.org/logs

# Fix wallets.json if it's a directory
if [ -d "/var/www/vhosts/viguri.org/crypto.viguri.org/wallets.json" ]; then
    rm -rf /var/www/vhosts/viguri.org/crypto.viguri.org/wallets.json
    echo "[]" > /var/www/vhosts/viguri.org/crypto.viguri.org/wallets.json
    chown viguri:psaserv /var/www/vhosts/viguri.org/crypto.viguri.org/wallets.json
    chmod 644 /var/www/vhosts/viguri.org/crypto.viguri.org/wallets.json
fi

# Fix permissions for all files and directories
chown -R viguri:psaserv /var/www/vhosts/viguri.org/crypto.viguri.org
find /var/www/vhosts/viguri.org/crypto.viguri.org -type d -exec chmod 755 {} \;
find /var/www/vhosts/viguri.org/crypto.viguri.org -type f -exec chmod 644 {} \;

# Make scripts executable
find /var/www/vhosts/viguri.org/crypto.viguri.org -name "*.sh" -exec chmod +x {} \;

echo "Permissions fixed successfully"
