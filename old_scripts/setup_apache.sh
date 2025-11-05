#!/bin/bash
set -e

echo "Setting up Apache for crypto.viguri.org..."

# Create the Apache configuration file
sudo cp /var/www/vhosts/viguri.org/crypto.viguri.org/apache_config.conf /etc/apache2/sites-available/crypto.viguri.org.conf

# Enable required Apache modules
echo "Enabling required Apache modules..."
sudo a2enmod ssl
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite

# Enable the site
echo "Enabling the site..."
sudo a2ensite crypto.viguri.org.conf

# Test the Apache configuration
echo "Testing Apache configuration..."
sudo apache2ctl configtest

# Reload Apache to apply changes
echo "Reloading Apache..."
sudo systemctl reload apache2

echo "Apache setup completed successfully!"
