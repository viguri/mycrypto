#!/bin/bash
set -e

echo "Applying final fixes for MyCrypto application..."

# 1. Fix permissions for logs directory
echo "Fixing permissions for logs directory..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chown -R www-data:www-data /var/www/vhosts/viguri.org/crypto.viguri.org/logs
chmod -R 755 /var/www/vhosts/viguri.org/crypto.viguri.org/logs

# 2. Restart the Docker container
echo "Restarting Docker containers..."
cd /var/www/vhosts/viguri.org/crypto.viguri.org
docker-compose down
docker-compose up -d

# 3. Wait for the container to start
echo "Waiting for containers to start..."
sleep 10

# 4. Create a proper Apache configuration
echo "Creating Apache configuration..."
cat > /etc/apache2/sites-available/crypto.viguri.org.conf << 'APACHECONF'
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

# 5. Enable required Apache modules
echo "Enabling required Apache modules..."
a2enmod proxy proxy_http headers rewrite

# 6. Test Apache configuration
echo "Testing Apache configuration..."
apache2ctl configtest

# 7. Reload Apache
echo "Reloading Apache..."
systemctl reload apache2

# 8. Test the API endpoints
echo "Testing API endpoints..."
echo "Testing /api/test endpoint:"
curl -s http://crypto.viguri.org/api/test || echo "Failed to connect to API endpoint"

# 9. Update client-side JavaScript to use relative URLs
echo "Updating client-side JavaScript to use relative URLs..."
cd /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/js
sed -i 's|http://localhost:3003/api|/api|g' *.js
sed -i 's|http://127.0.0.1:3003/api|/api|g' *.js

echo "Final fixes applied successfully!"
echo "Please refresh your browser and try again."
