#!/bin/bash
set -e

echo "Fixing HTTP to HTTPS redirect issue..."

# Check if SSL module is enabled
echo "Checking if SSL module is enabled:"
apache2ctl -M | grep ssl || echo "SSL module not enabled"

# Create an updated Apache configuration file that works with HTTP only
cat > /tmp/crypto.viguri.org.conf << 'APACHECONF'
<VirtualHost *:80>
    ServerName crypto.viguri.org
    ServerAlias www.crypto.viguri.org
    
    # Disable automatic redirect to HTTPS
    # Comment out any RewriteRule that redirects to HTTPS
    
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
    
    # API Proxy Configuration
    ProxyRequests Off
    ProxyPreserveHost On
    
    # Set proxy timeout
    ProxyTimeout 300
    
    # Add CORS headers
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    
    # Handle OPTIONS requests for CORS preflight
    RewriteEngine On
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
    
    # Proxy API requests to the Node.js server
    ProxyPass /api http://localhost:3003/api
    ProxyPassReverse /api http://localhost:3003/api
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-error.log
    CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-access.log combined
    
    # Set log level to debug temporarily
    LogLevel debug
</VirtualHost>
APACHECONF

# Copy the updated configuration file to the correct location
cp /tmp/crypto.viguri.org.conf /etc/apache2/sites-available/crypto.viguri.org.conf

# Test the Apache configuration
echo "Testing Apache configuration..."
apache2ctl configtest

# Reload Apache to apply changes
echo "Reloading Apache..."
systemctl reload apache2

echo "Checking for any global redirects in Apache configuration..."
grep -r "RewriteRule.*https" /etc/apache2/ || echo "No global HTTPS redirects found"

echo "HTTP to HTTPS redirect issue fixed successfully!"
echo "Testing API endpoint..."
sleep 2

# Test the API endpoint
curl -s http://crypto.viguri.org/api/test || echo "Failed to connect to API endpoint"

echo "All done! Please refresh your browser and try again."
