#!/bin/bash
set -e

echo "Disabling global HTTPS redirect for crypto.viguri.org..."

# 1. Find where the global redirect is configured
echo "Searching for global redirect configuration..."
REDIRECT_FILES=$(grep -l "RewriteRule.*https" /etc/apache2/ | grep -v "crypto.viguri.org")

echo "Found redirect rules in the following files:"
for file in $REDIRECT_FILES; do
  echo "- $file"
done

# 2. Create a specific exception for crypto.viguri.org
echo "Creating exception for crypto.viguri.org..."
cat > /etc/apache2/conf-available/crypto-viguri-org-exception.conf << 'CONF'
# Exception for crypto.viguri.org to prevent HTTPS redirect
<LocationMatch "^/(?!.*(plesk-stat|webstat|webmail|plesk-login|domains)).*$">
    <If "%{HTTP_HOST} =~ /^(www\.)?crypto\.viguri\.org/">
        # Skip the HTTPS redirect for this domain
        RewriteEngine On
        RewriteRule .* - [E=SKIP_HTTPS_REDIRECT:1]
    </If>
</LocationMatch>
CONF

# 3. Enable the exception configuration
echo "Enabling exception configuration..."
a2enconf crypto-viguri-org-exception

# 4. Update the main Apache configuration for crypto.viguri.org
echo "Updating main Apache configuration..."
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

# 5. Find the correct path for client JavaScript files
echo "Finding the correct path for client JavaScript files..."
JS_DIR=$(find /var/www/vhosts/viguri.org/crypto.viguri.org -type d -name "js" | head -n 1)

if [ -n "$JS_DIR" ]; then
    echo "Found JavaScript directory: $JS_DIR"
    echo "Updating client-side JavaScript to use relative URLs..."
    cd "$JS_DIR"
    sed -i 's|http://localhost:3003/api|/api|g' *.js
    sed -i 's|http://127.0.0.1:3003/api|/api|g' *.js
    echo "JavaScript files updated successfully."
else
    echo "JavaScript directory not found. Searching for JavaScript files..."
    JS_FILES=$(find /var/www/vhosts/viguri.org/crypto.viguri.org -type f -name "*.js" | xargs grep -l "localhost:3003/api")
    
    if [ -n "$JS_FILES" ]; then
        echo "Found JavaScript files with API URLs:"
        for file in $JS_FILES; do
            echo "Updating $file..."
            sed -i 's|http://localhost:3003/api|/api|g' "$file"
            sed -i 's|http://127.0.0.1:3003/api|/api|g' "$file"
        done
        echo "JavaScript files updated successfully."
    else
        echo "No JavaScript files with API URLs found."
    fi
fi

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

echo "HTTPS redirect disabled successfully!"
echo "Please refresh your browser and try again."
