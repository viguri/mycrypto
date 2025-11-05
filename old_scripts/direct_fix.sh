#!/bin/bash
set -e

echo "Applying direct fix for MyCrypto application..."

# 1. Create a specific Apache configuration file for crypto.viguri.org
echo "Creating Apache configuration file..."
cat > /etc/apache2/sites-available/crypto.viguri.org.conf << 'APACHECONF'
<VirtualHost *:80>
    ServerName crypto.viguri.org
    ServerAlias www.crypto.viguri.org
    
    # Disable automatic redirect to HTTPS
    # This setting overrides the global redirect
    SetEnvIf Host "^(www\.)?crypto\.viguri\.org" NO_HTTPS_REDIRECT=1
    
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

# 2. Create a custom configuration to disable HTTPS redirect
echo "Creating custom configuration to disable HTTPS redirect..."
cat > /etc/apache2/conf-available/disable-https-redirect-for-crypto.conf << 'CONF'
# Disable HTTPS redirect for crypto.viguri.org
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{ENV:NO_HTTPS_REDIRECT} =1
    RewriteRule .* - [E=REDIRECT_TO_HTTPS:0]
</IfModule>
CONF

# 3. Enable the custom configuration
echo "Enabling custom configuration..."
a2enconf disable-https-redirect-for-crypto

# 4. Find and update JavaScript files
echo "Finding and updating JavaScript files..."
find /var/www/vhosts/viguri.org/crypto.viguri.org -type f -name "*.js" -exec grep -l "localhost:3003/api" {} \; | while read file; do
    echo "Updating $file..."
    sed -i 's|http://localhost:3003/api|/api|g' "$file"
    sed -i 's|http://127.0.0.1:3003/api|/api|g' "$file"
done

# 5. Test Apache configuration
echo "Testing Apache configuration..."
apache2ctl configtest

# 6. Restart Apache (not just reload)
echo "Restarting Apache..."
systemctl restart apache2

# 7. Test the API endpoints
echo "Testing API endpoints..."
echo "Testing /api/test endpoint:"
curl -s http://localhost/api/test || echo "Failed to connect to API endpoint"

echo "Direct fix applied successfully!"
echo "Please try accessing http://crypto.viguri.org in your browser."
