#!/bin/bash
# Script to check logs of the server container on your remote server

SERVER_USER="viguri"
SERVER_IP="81.169.168.33"
REMOTE_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"

echo "Connecting to server to check container logs..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && docker logs cryptoviguriorg-server-1"
