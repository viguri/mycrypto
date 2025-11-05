#!/bin/bash
# Comprehensive deployment script for MyCrypto to crypto.viguri.org
# Run this script from your local machine
# Updated with all fixes for proper deployment

set -e

# Configuration
SERVER_USER="viguri"  # Change this to your server username
SERVER_IP="81.169.168.33"  # Change this to your server IP
DOMAIN="crypto.viguri.org"
REMOTE_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"
LOCAL_DIR="/Users/viguri/GitHub/mycrypto"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of MyCrypto to $DOMAIN${NC}"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa ]; then
    echo -e "${YELLOW}SSH key not found. Generating new SSH key...${NC}"
    ssh-keygen -t rsa -b 4096 -f ~/.ssh/id_rsa -N ""
    echo -e "${YELLOW}Copy this SSH key to your server:${NC}"
    cat ~/.ssh/id_rsa.pub
    echo -e "${YELLOW}Run this on your server:${NC}"
    echo "mkdir -p ~/.ssh && echo '[PASTE KEY HERE]' >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys"
    read -p "Press Enter once you've added the SSH key to your server..." confirm
fi

# Test SSH connection
echo -e "${GREEN}Testing SSH connection...${NC}"
ssh -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP "echo SSH connection successful"

# Fix 1: Create logs API route file
echo -e "${GREEN}Creating logs API route file...${NC}"
mkdir -p server/api/routes/logs
cat > server/api/routes/logs/index.js << 'EOF'
import express from 'express';
import { asyncHandler } from '../../../middleware/async.js';
import { logger } from '../../../utils/logger/index.js';

const logsRoutes = () => {
    const router = express.Router();
    
    // Get all logs
    router.get('/', asyncHandler(async (req, res) => {
        try {
            const logs = await logger.getLogs();
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error('Error retrieving logs:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs' });
        }
    }));

    // Get logs by level
    router.get('/level/:level', asyncHandler(async (req, res) => {
        try {
            const { level } = req.params;
            const logs = await logger.getLogsByLevel(level);
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error(`Error retrieving logs by level ${req.params.level}:`, error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs by level' });
        }
    }));

    // Get logs by component
    router.get('/component/:component', asyncHandler(async (req, res) => {
        try {
            const { component } = req.params;
            const logs = await logger.getLogsByComponent(component);
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error(`Error retrieving logs by component ${req.params.component}:`, error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs by component' });
        }
    }));

    return router;
};

export default logsRoutes;
EOF

# Fix 2: Update security.js to fix Content Security Policy
echo -e "${GREEN}Updating Content Security Policy in security.js...${NC}"
if [ -f "server/middleware/security.js" ]; then
    # Make a backup
    cp server/middleware/security.js server/middleware/security.js.bak
    
    # Update the CSP configuration
    sed -i '' 's/scriptSrc: (process.env.CSP_SCRIPT_SRC || '\'self\'').split('\',\'').map(src => `'\'${src}'\'`)/scriptSrc: process.env.CSP_SCRIPT_SRC ? process.env.CSP_SCRIPT_SRC.split('\',\'').map(src => src === '\'self\'' ? "'\'self\'"" : src) : ["'\'self\'""]/' server/middleware/security.js
    sed -i '' 's/styleSrc: (process.env.CSP_STYLE_SRC || '\'self\'').split('\',\'').map(src => `'\'${src}'\'`)/styleSrc: process.env.CSP_STYLE_SRC ? process.env.CSP_STYLE_SRC.split('\',\'').map(src => src === '\'self\'' ? "'\'self\'"" : src) : ["'\'self\'"", "'\'unsafe-inline\'""]/' server/middleware/security.js
    sed -i '' 's/imgSrc: (process.env.CSP_IMG_SRC || '\'self,data:,https:'\'').split('\',\'').map(src => `'\'${src}'\'`)/imgSrc: process.env.CSP_IMG_SRC ? process.env.CSP_IMG_SRC.split('\',\'').map(src => src === '\'self\'' ? "'\'self\'"" : src) : ["'\'self\'"", "data:", "https:"]/' server/middleware/security.js
    sed -i '' 's/connectSrc: (process.env.CSP_CONNECT_SRC || '\'self\'').split('\',\'').map(src => `'\'${src}'\'`)/connectSrc: process.env.CSP_CONNECT_SRC ? process.env.CSP_CONNECT_SRC.split('\',\'').map(src => src === '\'self\'' ? "'\'self\'"" : src) : ["'\'self\'""]/' server/middleware/security.js
    sed -i '' 's/fontSrc: (process.env.CSP_FONT_SRC || '\'self,https:,data:'\'').split('\',\'').map(src => `'\'${src}'\'`)/fontSrc: process.env.CSP_FONT_SRC ? process.env.CSP_FONT_SRC.split('\',\'').map(src => src === '\'self\'' ? "'\'self\'"" : src) : ["'\'self\'"", "https:", "data:"]/' server/middleware/security.js
fi

# Fix 3: Create updated docker-compose.yml with correct paths and health check
echo -e "${GREEN}Creating updated docker-compose.yml...${NC}"
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cryptoviguriorg-server-1
    restart: unless-stopped
    ports:
      - "3003:3003"
    volumes:
      - /var/www/vhosts/viguri.org/crypto.viguri.org/logs:/app/logs
      - ./server/storage:/app/server/storage
    environment:
      - NODE_ENV=production
      - PORT=3003
      - ALLOWED_ORIGINS=https://crypto.viguri.org,http://localhost:3003,http://localhost:8080,http://server:3003
      - LOG_LEVEL=info
      - BLOCKCHAIN_DIFFICULTY=4
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/api/test"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 15s

  cli:
    build:
      context: .
      dockerfile: Dockerfile.cli
    container_name: cryptoviguriorg-cli-1
    depends_on:
      server:
        condition: service_healthy
    volumes:
      - ./cli-data:/app/cli-data
    environment:
      - NODE_ENV=production
      - SERVER_URL=http://server:3003
EOF

# Fix 4: Update Dockerfile to ensure logs directory exists and has proper permissions
echo -e "${GREEN}Updating Dockerfile...${NC}"
if [ -f "Dockerfile" ]; then
    # Make a backup
    cp Dockerfile Dockerfile.bak
    
    # Add lines to create logs directory with proper permissions
    sed -i '' '/WORKDIR \/app/a\
RUN mkdir -p /app/logs && chmod -R 777 /app/logs' Dockerfile
fi

# Fix 5: Create Nginx configuration file
echo -e "${GREEN}Creating Nginx configuration file...${NC}"
mkdir -p nginx
cat > nginx/crypto.viguri.org.conf << 'EOF'
server {
    listen 80;
    server_name crypto.viguri.org;

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name crypto.viguri.org;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/crypto.viguri.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crypto.viguri.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy no-referrer-when-downgrade;

    # Root directory
    root /var/www/vhosts/viguri.org/crypto.viguri.org/client/public;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3003/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

# Fix 6: Create a permissions fix script that will run on the server
echo -e "${GREEN}Creating permissions fix script...${NC}"
cat > fix_permissions.sh << 'EOF'
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
EOF
chmod +x fix_permissions.sh

# Create deployment package
echo -e "${GREEN}Creating deployment package...${NC}"
cd $LOCAL_DIR
TEMP_DIR=$(mktemp -d)
PACKAGE_NAME="mycrypto_deployment.tar.gz"

# Copy necessary files to temp directory
rsync -av --exclude=node_modules --exclude=.git --exclude=logs ./ $TEMP_DIR/

# Make scripts executable
chmod +x $TEMP_DIR/deploy.sh $TEMP_DIR/server_setup.sh $TEMP_DIR/deploy_to_viguri.sh $TEMP_DIR/fix_permissions.sh

# Create tarball
tar -czf $PACKAGE_NAME -C $TEMP_DIR .
rm -rf $TEMP_DIR

# Transfer files to server
echo -e "${GREEN}Transferring files to server...${NC}"
ssh $SERVER_USER@$SERVER_IP "mkdir -p $REMOTE_DIR"
scp $PACKAGE_NAME $SERVER_USER@$SERVER_IP:$REMOTE_DIR/
rm $PACKAGE_NAME

# Extract and set up on server
echo -e "${GREEN}Setting up application on server...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && tar -xzf $PACKAGE_NAME && rm $PACKAGE_NAME"

# Run server setup script
echo -e "${GREEN}Running server setup script...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && chmod +x server_setup.sh && ./server_setup.sh"

# Fix permissions on the server
echo -e "${GREEN}Fixing permissions on the server...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && chmod +x fix_permissions.sh && sudo ./fix_permissions.sh"

# Create remote script to fix Docker deployment
echo -e "${GREEN}Creating Docker deployment fix script on server...${NC}"
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && cat > fix_docker_deployment.sh << 'EOFREMOTE'
#!/bin/bash

echo \"=== Fixing Docker deployment for MyCrypto ==\"\n
# Stop any running containers
docker-compose down

# Create logs directory with proper permissions
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chown -R viguri:psaserv /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chmod -R 755 /var/www/vhosts/viguri.org/crypto.viguri.org/logs

# Create logs API route directory if it doesn't exist
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/server/api/routes/logs

# Rebuild and restart containers
docker-compose build server
docker-compose up -d

echo \"Docker deployment fixed\"\n
EOFREMOTE
chmod +x fix_docker_deployment.sh"

# Provide deployment instructions with fixes
echo -e "${YELLOW}To complete the deployment, please SSH into your server and run:${NC}"
echo -e "${GREEN}ssh $SERVER_USER@$SERVER_IP${NC}"
echo -e "${GREEN}cd $REMOTE_DIR${NC}"
echo -e "${GREEN}chmod +x deploy.sh fix_docker_deployment.sh${NC}"
echo -e "${GREEN}./deploy.sh${NC}"
echo -e "${GREEN}./fix_docker_deployment.sh${NC}"

echo -e "${YELLOW}If you encounter sudo password prompts, you'll need to run these commands manually:${NC}"
echo -e "${GREEN}sudo docker-compose down${NC}"
echo -e "${GREEN}sudo docker-compose build server${NC}"
echo -e "${GREEN}sudo docker-compose up -d${NC}"

# Verify deployment
echo -e "${GREEN}Verifying deployment...${NC}"
ssh $SERVER_USER@$SERVER_IP "docker ps | grep cryptoviguriorg"

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application should be available at https://$DOMAIN${NC}"
echo -e "${YELLOW}Important post-deployment steps:${NC}"
echo -e "${YELLOW}1. Check Docker container logs: docker logs cryptoviguriorg-server-1${NC}"
echo -e "${YELLOW}2. Verify Nginx configuration: sudo nginx -t${NC}"
echo -e "${YELLOW}3. Restart Nginx if needed: sudo systemctl restart nginx${NC}"
echo -e "${YELLOW}4. Check application in browser: https://$DOMAIN${NC}"
