#!/bin/bash
set -e

echo "Fixing API proxy configuration for crypto.viguri.org..."

# Check if the Node.js server is running
echo "Checking if Node.js server is running:"
docker ps | grep cryptoviguriorg-server || echo "Server container not running"

# Restart the server container if needed
echo "Restarting the server container:"
docker restart cryptoviguriorg-server-1 || echo "Failed to restart server container"

# Wait for the server to start
echo "Waiting for server to start..."
sleep 5

# Create an updated Apache configuration file with fixed proxy settings
cat > /tmp/crypto.viguri.org.conf << 'APACHECONF'
<VirtualHost *:80>
    ServerName crypto.viguri.org
    ServerAlias www.crypto.viguri.org
    
    # Redirect to HTTPS
    RewriteEngine On
    RewriteRule ^ https://%{SERVER_NAME}%{REQUEST_URI} [END,NE,R=permanent]
</VirtualHost>

<VirtualHost *:443>
    ServerName crypto.viguri.org
    ServerAlias www.crypto.viguri.org
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/crypto.viguri.org/fullchain.pem
    SSLCertificateKeyFile /etc/ssl/crypto.viguri.org/privkey.pem
    
    # Document root
    DocumentRoot /var/www/vhosts/viguri.org/crypto.viguri.org/client/public
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    
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
    
    # Add CORS headers for API requests
    <Location /api>
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        
        # Handle OPTIONS requests for CORS preflight
        RewriteEngine On
        RewriteCond %{REQUEST_METHOD} OPTIONS
        RewriteRule ^(.*)$ $1 [R=200,L]
    </Location>
    
    # Proxy API requests to the Node.js server
    ProxyPass /api http://127.0.0.1:3003/api
    ProxyPassReverse /api http://127.0.0.1:3003/api
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-error.log
    CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-access.log combined
    
    # Set log level to debug temporarily
    LogLevel debug proxy:trace5
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

echo "Checking Docker container health:"
docker inspect --format='{{.State.Health.Status}}' cryptoviguriorg-server-1 || echo "Health check not available"

echo "API proxy configuration fixed successfully!"
echo "Testing API endpoint..."
sleep 2

# Test the API endpoint with verbose output
echo "Testing with curl:"
curl -k -v https://crypto.viguri.org/api/test

echo "All done! Please refresh your browser and try again with HTTPS."
