#!/bin/bash
set -e

# MyCrypto Deployment Script
# This script deploys the MyCrypto application to crypto.viguri.org
# Author: Manuel Rodriguez de Viguri
# Date: March 29, 2025

echo "Starting MyCrypto deployment to crypto.viguri.org..."

# Configuration
SERVER="viguri@81.169.168.33"
REMOTE_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"
SSH_KEY="$HOME/.ssh/id_rsa"
LOCAL_DIR="$(pwd)"

echo "This script will deploy the MyCrypto application to $SERVER:$REMOTE_DIR"
echo "Press Enter to continue or Ctrl+C to cancel..."
read

# Step 1: Check if files exist
echo "Checking application files..."
if [ ! -d "$LOCAL_DIR/client/public" ]; then
  echo "Error: client/public directory not found!"
  exit 1
fi

if [ ! -d "$LOCAL_DIR/server" ]; then
  echo "Error: server directory not found!"
  exit 1
fi

echo "Application files found, proceeding with deployment..."

# Step 2: Create deployment package
echo "Creating deployment package..."
DEPLOY_DIR="$LOCAL_DIR/deploy"
rm -rf "$DEPLOY_DIR"
mkdir -p "$DEPLOY_DIR"

# Copy client files
echo "Copying client files..."
mkdir -p "$DEPLOY_DIR/client"
cp -r "$LOCAL_DIR/client/public" "$DEPLOY_DIR/client/"

# Copy server files
echo "Copying server files..."
mkdir -p "$DEPLOY_DIR/server"
cp -r "$LOCAL_DIR/server" "$DEPLOY_DIR/"

# Copy Docker files
echo "Copying Docker files..."
cp "$LOCAL_DIR/Dockerfile" "$DEPLOY_DIR/"
cp "$LOCAL_DIR/docker-compose.yml" "$DEPLOY_DIR/"

# Copy environment files
echo "Copying environment files..."
cp "$LOCAL_DIR/config.env.production" "$DEPLOY_DIR/" 2>/dev/null || echo "No production config found, continuing..."

# Update client-side JavaScript to use relative URLs locally before packaging
echo "Updating client-side JavaScript to use relative URLs..."
find "$DEPLOY_DIR/client/public" -type f -name "*.js" -exec grep -l "localhost:3003/api" {} \; | while read file; do
    echo "Updating $file..."
    sed -i '' 's|http://localhost:3003/api|/api|g' "$file" 2>/dev/null || sed -i 's|http://localhost:3003/api|/api|g' "$file"
    sed -i '' 's|http://127.0.0.1:3003/api|/api|g' "$file" 2>/dev/null || sed -i 's|http://127.0.0.1:3003/api|/api|g' "$file"
done

# Create .htaccess file
echo "Creating .htaccess file..."
cat > "$DEPLOY_DIR/client/public/.htaccess" << 'HTACCESS'
# Enable rewrite engine
RewriteEngine On

# API Proxy Rules
RewriteCond %{REQUEST_URI} ^/api/(.*)
RewriteRule ^api/(.*) http://172.17.0.1:3003/api/$1 [P,L]

# Handle OPTIONS requests for CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# SPA Rewrite Rules - Only if not an existing file or directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# CORS headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
</IfModule>
HTACCESS

# Step 3: Create deployment package
echo "Creating deployment package..."
PACKAGE_NAME="mycrypto-deploy-$(date +%Y%m%d%H%M%S).tar.gz"
tar -czf "$PACKAGE_NAME" -C "$DEPLOY_DIR" .

# Step 4: Deploy to server
echo "Deploying to server..."
scp -i "$SSH_KEY" "$PACKAGE_NAME" "$SERVER:$REMOTE_DIR/"

# Step 5: Connect to server and provide instructions
echo "Connecting to server for final setup..."
echo "Please run the following commands on the server:"
echo "1. cd $REMOTE_DIR"
echo "2. tar -xzf $PACKAGE_NAME"
echo "3. ln -sf client/public httpdocs"
echo "4. docker-compose down"
echo "5. docker-compose up -d"
echo "6. curl http://localhost:3003/api/test"
echo ""
echo "After running these commands, you can access the application at https://crypto.viguri.org"
echo "Remember to enable .htaccess files in Plesk control panel if needed."
echo ""
echo "Connecting to server now..."
ssh -i "$SSH_KEY" "$SERVER"
