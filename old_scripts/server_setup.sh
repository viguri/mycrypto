#!/bin/bash
# Server setup script for MyCrypto on crypto.viguri.org
# Run this script on your Ubuntu server

set -e

# Configuration
DOMAIN="crypto.viguri.org"
APP_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"
USER=$(whoami)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting server setup for MyCrypto on $DOMAIN${NC}"

# Check if we can run sudo without a password
if sudo -n true 2>/dev/null; then
  CAN_SUDO=true
  echo -e "${GREEN}Sudo access confirmed. Proceeding with automated setup.${NC}"
else
  CAN_SUDO=false
  echo -e "${YELLOW}Cannot run sudo commands without a password. Some steps will need to be run manually.${NC}"
  echo -e "${YELLOW}Please run the following commands manually after this script completes:${NC}"
  echo -e "sudo apt update && sudo apt upgrade -y"
  echo -e "sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl"
  echo -e "sudo systemctl start docker && sudo systemctl enable docker"
  echo -e "sudo usermod -aG docker $USER"
  echo -e "sudo cp ./nginx/crypto.viguri.org.conf /etc/nginx/sites-available/crypto.viguri.org"
  echo -e "sudo ln -sf /etc/nginx/sites-available/crypto.viguri.org /etc/nginx/sites-enabled/"
  echo -e "sudo nginx -t && sudo systemctl reload nginx"
  echo -e "sudo certbot --nginx -d $DOMAIN"
  echo -e "sudo cp ./mycrypto.service /etc/systemd/system/"
  echo -e "sudo systemctl daemon-reload && sudo systemctl enable mycrypto.service"
fi

# Update system packages only if we can sudo without password
if [ "$CAN_SUDO" = true ]; then
  echo -e "${GREEN}Updating system packages...${NC}"
  sudo apt update && sudo apt upgrade -y
fi

# Only run these steps if we can sudo without password
if [ "$CAN_SUDO" = true ]; then
  # Install required dependencies
  echo -e "${GREEN}Installing required dependencies...${NC}"
  sudo apt install -y docker.io docker-compose nginx certbot python3-certbot-nginx git curl

  # Start and enable Docker
  echo -e "${GREEN}Setting up Docker...${NC}"
  sudo systemctl start docker
  sudo systemctl enable docker
  sudo usermod -aG docker $USER
  echo -e "${YELLOW}You may need to log out and back in for Docker group changes to take effect${NC}"

  # Set up Nginx
  echo -e "${GREEN}Setting up Nginx...${NC}"
  sudo cp ./nginx/crypto.viguri.org.conf /etc/nginx/sites-available/crypto.viguri.org
  sudo ln -sf /etc/nginx/sites-available/crypto.viguri.org /etc/nginx/sites-enabled/
  sudo nginx -t && sudo systemctl reload nginx

  # Set up SSL with Let's Encrypt
  echo -e "${GREEN}Setting up SSL with Let's Encrypt...${NC}"
  sudo certbot --nginx -d $DOMAIN

  # Copy systemd service file
  echo -e "${GREEN}Setting up systemd service...${NC}"
  sudo cp ./mycrypto.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable mycrypto.service
fi

# Create application directory (try without sudo first)
echo -e "${GREEN}Creating application directory...${NC}"
if [ -w "$(dirname $APP_DIR)" ]; then
  mkdir -p $APP_DIR
else
  if [ "$CAN_SUDO" = true ]; then
    sudo mkdir -p $APP_DIR
    sudo chown $USER:$USER $APP_DIR
  else
    echo -e "${YELLOW}Cannot create $APP_DIR. Please create it manually with:${NC}"
    echo -e "sudo mkdir -p $APP_DIR"
    echo -e "sudo chown $USER:$USER $APP_DIR"
  fi
fi

# Create production environment file
echo -e "${GREEN}Creating production environment file...${NC}"
cat > $APP_DIR/config.env << EOF
NODE_ENV=production
PORT=3003
HOST=0.0.0.0
ALLOWED_ORIGINS=https://$DOMAIN
RATE_LIMIT_MAX=100
LOG_LEVEL=info
BLOCKCHAIN_DIFFICULTY=4
EOF

echo -e "${GREEN}Server setup completed successfully!${NC}"
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Copy your application files to $APP_DIR"
echo -e "2. Start the application with: sudo systemctl start mycrypto"
echo -e "3. Check status with: sudo systemctl status mycrypto"
echo -e "4. View logs with: sudo journalctl -u mycrypto -f"
