#!/bin/bash
# Script to restart Docker containers on your remote server

SERVER_USER="viguri"
SERVER_IP="81.169.168.33"
REMOTE_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"

echo "Restarting Docker containers on server..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && sudo docker-compose -f docker-compose.prod.yml down && sudo docker-compose -f docker-compose.prod.yml up -d"

echo "Checking container status..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && docker ps"
