#!/bin/bash
# Simple script to transfer the updated deploy.sh to your server

SERVER_USER="viguri"
SERVER_IP="81.169.168.33"
REMOTE_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"

echo "Transferring updated deploy.sh to server..."
scp deploy.sh $SERVER_USER@$SERVER_IP:$REMOTE_DIR/

echo "Done! Now run the updated script on your server."
