#!/bin/bash
set -e

echo "Setting up Nginx for crypto.viguri.org..."

# Copy the configuration file to sites-available
sudo cp /var/www/vhosts/viguri.org/crypto.viguri.org/nginx/crypto.viguri.org.conf /etc/nginx/sites-available/

# Create a symbolic link to enable the site
sudo ln -sf /etc/nginx/sites-available/crypto.viguri.org.conf /etc/nginx/sites-enabled/

# Test the Nginx configuration
echo "Testing Nginx configuration..."
sudo nginx -t

# Reload Nginx to apply changes
echo "Reloading Nginx..."
sudo systemctl reload nginx

echo "Nginx setup completed successfully!"
