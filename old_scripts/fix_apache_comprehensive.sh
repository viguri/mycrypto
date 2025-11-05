#!/bin/bash
set -e

echo "Fixing Apache proxy configuration for crypto.viguri.org (comprehensive)..."

# Create an updated Apache configuration file with comprehensive proxy settings
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
    
    # Enable required modules
    <IfModule mod_proxy.c>
        <IfModule mod_proxy_http.c>
            # Main API proxy - IMPORTANT: This must come AFTER specific endpoint rules
            ProxyRequests Off
            ProxyPreserveHost On
            
            # Set timeout values
            ProxyTimeout 300
            
            # Add CORS headers if needed
            Header always set Access-Control-Allow-Origin "*"
            Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
            Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
            
            # Specific API endpoints - list them all explicitly
            ProxyPass /api/test http://localhost:3003/api/test
            ProxyPassReverse /api/test http://localhost:3003/api/test
            
            ProxyPass /api/registration/wallets http://localhost:3003/api/registration/wallets
            ProxyPassReverse /api/registration/wallets http://localhost:3003/api/registration/wallets
            
            ProxyPass /api/registration/wallet http://localhost:3003/api/registration/wallet
            ProxyPassReverse /api/registration/wallet http://localhost:3003/api/registration/wallet
            
            ProxyPass /api/blockchain http://localhost:3003/api/blockchain
            ProxyPassReverse /api/blockchain http://localhost:3003/api/blockchain
            
            ProxyPass /api/transactions http://localhost:3003/api/transactions
            ProxyPassReverse /api/transactions http://localhost:3003/api/transactions
            
            ProxyPass /api/mining http://localhost:3003/api/mining
            ProxyPassReverse /api/mining http://localhost:3003/api/mining
            
            ProxyPass /api/logs http://localhost:3003/api/logs
            ProxyPassReverse /api/logs http://localhost:3003/api/logs
            
            # Catch-all for any other API endpoints
            ProxyPass /api http://localhost:3003/api
            ProxyPassReverse /api http://localhost:3003/api
        </IfModule>
    </IfModule>
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-error.log
    CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-access.log combined
    
    # Set log level to debug temporarily
    LogLevel debug
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
echo "Now checking if the API is accessible through Apache..."

# Wait a moment for Apache to fully reload
sleep 2

# Test the API endpoints
echo "Testing /api/test endpoint:"
curl -s -o /dev/null -w "%{http_code}" http://crypto.viguri.org/api/test
echo " <- HTTP status code"

echo "Testing /api/registration/wallets endpoint:"
curl -s -o /dev/null -w "%{http_code}" http://crypto.viguri.org/api/registration/wallets
echo " <- HTTP status code"

echo "Testing /api/blockchain endpoint:"
curl -s -o /dev/null -w "%{http_code}" http://crypto.viguri.org/api/blockchain
echo " <- HTTP status code"

echo "All done! If you're still experiencing issues, please check the Apache error logs."
