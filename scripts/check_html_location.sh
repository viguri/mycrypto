#!/bin/bash

echo "Checking HTML file locations and server configuration..."

# Check local HTML files
echo "Local HTML files:"
echo "1. Client HTML files:"
ls -la client/public/*.html

echo "2. Server HTML files:"
ls -la server/public/*.html

# Check server configuration
echo "Checking server configuration..."
ssh viguri@81.169.168.33 "
echo 'Current symbolic link:'
ls -la /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs
echo 'Files in httpdocs:'
ls -la /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs/*.html 2>/dev/null || echo 'No HTML files found'
echo 'Client HTML files on server:'
ls -la /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/*.html 2>/dev/null || echo 'No HTML files found'
echo 'Server HTML files on server:'
ls -la /var/www/vhosts/viguri.org/crypto.viguri.org/server/public/*.html 2>/dev/null || echo 'No HTML files found'
"

echo "Based on our deployment configuration, the symbolic link should point to client/public."
echo "If the symbolic link is incorrect or the HTML files are missing, run the fix script:"
echo "./scripts/fix_403_error.sh"
