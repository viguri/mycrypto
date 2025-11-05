#!/bin/bash
set -e

echo "Fixing Apache proxy configuration for crypto.viguri.org..."

# Create an updated Apache configuration file with improved proxy settings
cat > /tmp/crypto.viguri.org.conf << 'APACHECONF'
<VirtualHost *:80>
    ServerName crypto.viguri.org
    ServerAlias www.crypto.viguri.org
    
    # Document root
    DocumentRoot /var/www/vhosts/viguri.org/crypto.viguri.org/client/public
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    
    # Directory configuration
    <Directory /var/www/vhosts/viguri.org/crypto.viguri.org/client/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Rewrite rules for SPA
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API Proxy - Improved configuration
    ProxyRequests Off
    ProxyPreserveHost On
    
    # Enable required proxy modules
    <IfModule mod_proxy.c>
        <IfModule mod_proxy_http.c>
            # Main API proxy
            ProxyPass /api http://localhost:3003/api
            ProxyPassReverse /api http://localhost:3003/api
            
            # Specific API endpoints
            ProxyPass /api/registration http://localhost:3003/api/registration
            ProxyPassReverse /api/registration http://localhost:3003/api/registration
            
            # Explicitly define the wallets endpoint
            ProxyPass /api/registration/wallets http://localhost:3003/api/registration/wallets
            ProxyPassReverse /api/registration/wallets http://localhost:3003/api/registration/wallets
        </IfModule>
    </IfModule>
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-error.log
    CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-access.log combined
</VirtualHost>
APACHECONF

# Copy the updated configuration file to the correct location
sudo cp /tmp/crypto.viguri.org.conf /etc/apache2/sites-available/crypto.viguri.org.conf

# Make sure all required modules are enabled
echo "Enabling required Apache modules..."
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod headers
sudo a2enmod rewrite

# Test the Apache configuration
echo "Testing Apache configuration..."
sudo apache2ctl configtest

# Reload Apache to apply changes
echo "Reloading Apache..."
sudo systemctl reload apache2

echo "Apache proxy configuration fixed successfully!"
