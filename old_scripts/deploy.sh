#!/bin/bash
# Deployment script for MyCrypto to crypto.viguri.org
# This script should be run on your Ubuntu server

set -e

# Configuration
APP_NAME="mycrypto"
REPO_URL="https://github.com/viguri/mycrypto.git"
DEPLOY_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"
DOMAIN="crypto.viguri.org"
PORT=3003

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting deployment of $APP_NAME to $DOMAIN${NC}"

# Check if we can run sudo without a password
if sudo -n true 2>/dev/null; then
  CAN_SUDO=true
  echo -e "${GREEN}Sudo access confirmed. Proceeding with automated setup.${NC}"
else
  CAN_SUDO=false
  echo -e "${YELLOW}Cannot run sudo commands without a password. Some steps will need to be run manually.${NC}"
  echo -e "${YELLOW}Please run the following commands manually if needed:${NC}"
  echo -e "sudo mkdir -p $DEPLOY_DIR"
  echo -e "sudo chown $USER:$USER $DEPLOY_DIR"
  echo -e "sudo docker-compose -f docker-compose.prod.yml down"
  echo -e "sudo docker-compose -f docker-compose.prod.yml up -d --build"
fi

# Create deployment directory if it doesn't exist
if [ ! -d "$DEPLOY_DIR" ]; then
  echo -e "${GREEN}Creating deployment directory $DEPLOY_DIR${NC}"
  if [ -w "$(dirname $DEPLOY_DIR)" ]; then
    mkdir -p $DEPLOY_DIR
  elif [ "$CAN_SUDO" = true ]; then
    sudo mkdir -p $DEPLOY_DIR
    sudo chown $USER:$USER $DEPLOY_DIR
  else
    echo -e "${RED}Cannot create $DEPLOY_DIR. Please create it manually with the commands above.${NC}"
  fi
fi

# Check if we're already in the deployment directory
if [ "$(pwd)" = "$DEPLOY_DIR" ]; then
  echo -e "${GREEN}Already in deployment directory${NC}"
else
  echo -e "${GREEN}Changing to deployment directory${NC}"
  cd $DEPLOY_DIR || {
    echo -e "${RED}Failed to change to deployment directory $DEPLOY_DIR${NC}"
    exit 1
  }
fi

# Skip git operations if files were transferred via deploy_to_viguri.sh
if [ -f "deploy_to_viguri.sh" ]; then
  echo -e "${GREEN}Files already transferred. Skipping git operations.${NC}"
else
  # Clone or pull the repository
  if [ -d ".git" ]; then
    echo -e "${GREEN}Updating existing repository${NC}"
    git pull
  else
    echo -e "${GREEN}Cloning repository${NC}"
    git clone $REPO_URL .
  fi
fi

# Create production environment file
echo -e "${GREEN}Creating production environment file${NC}"
cat > $DEPLOY_DIR/config.env << EOF
NODE_ENV=production
PORT=$PORT
HOST=0.0.0.0
ALLOWED_ORIGINS=https://$DOMAIN
RATE_LIMIT_MAX=100
LOG_LEVEL=info
BLOCKCHAIN_DIFFICULTY=4
EOF

# Build and start Docker containers
echo -e "${GREEN}Building and starting Docker containers${NC}"
if command -v docker-compose &> /dev/null; then
  DOCKER_CMD="docker-compose"
elif command -v docker &> /dev/null && docker compose version &> /dev/null; then
  DOCKER_CMD="docker compose"
else
  echo -e "${RED}Neither docker-compose nor docker compose is available. Please install Docker and Docker Compose.${NC}"
  exit 1
fi

# Try to run Docker commands
if [ "$CAN_SUDO" = true ] || id -nG "$USER" | grep -qw "docker"; then
  $DOCKER_CMD -f docker-compose.prod.yml down || true
  $DOCKER_CMD -f docker-compose.prod.yml up -d --build
else
  echo -e "${YELLOW}You may need to run Docker commands with sudo:${NC}"
  echo -e "sudo $DOCKER_CMD -f docker-compose.prod.yml down"
  echo -e "sudo $DOCKER_CMD -f docker-compose.prod.yml up -d --build"
fi

# Set up Nginx
echo -e "${GREEN}Setting up Nginx configuration${NC}"

# Check if we can use sudo without password
if [ "$CAN_SUDO" = true ]; then
  echo -e "${GREEN}Configuring Nginx with sudo${NC}"
  sudo cp ./nginx/$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN
  sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx
else
  echo -e "${YELLOW}Cannot configure Nginx automatically. Please run these commands manually:${NC}"
  echo -e "sudo cp ./nginx/$DOMAIN.conf /etc/nginx/sites-available/$DOMAIN"
  echo -e "sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
  echo -e "sudo nginx -t && sudo systemctl reload nginx"
  echo -e "sudo certbot --nginx -d $DOMAIN"
  
  # Verify that the Nginx config file exists
  if [ -f "./nginx/$DOMAIN.conf" ]; then
    echo -e "${GREEN}Nginx configuration file exists: ./nginx/$DOMAIN.conf${NC}"
  else
    echo -e "${RED}Nginx configuration file not found: ./nginx/$DOMAIN.conf${NC}"
    echo -e "${YELLOW}Creating Nginx configuration file...${NC}"
    
    # Create the nginx directory if it doesn't exist
    mkdir -p ./nginx
    
    # Create the Nginx configuration file
    cat > ./nginx/$DOMAIN.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    
    location / {
        proxy_pass http://localhost:$PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
    echo -e "${GREEN}Nginx configuration file created: ./nginx/$DOMAIN.conf${NC}"
  fi
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application should be available at https://$DOMAIN${NC}"
echo -e "${RED}Note: Make sure to set up SSL certificates with Let's Encrypt before accessing the site${NC}"
echo -e "${RED}Run: sudo certbot --nginx -d $DOMAIN${NC}"
