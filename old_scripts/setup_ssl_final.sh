#!/bin/bash
set -e

echo "Setting up SSL for crypto.viguri.org..."

# 1. Check if the Node.js server is running
echo "Checking if Node.js server is running..."
curl -s http://localhost:3003/api/test && echo "Node.js server is working!" || {
  echo "Node.js server not responding. Starting Docker containers..."
  cd /var/www/vhosts/viguri.org/crypto.viguri.org
  docker-compose up -d
  sleep 10
}

# 2. Create directory for SSL certificates if it doesn't exist
echo "Creating SSL certificate directory..."
mkdir -p /etc/ssl/crypto.viguri.org

# 3. Generate a self-signed certificate if it doesn't exist
if [ ! -f /etc/ssl/crypto.viguri.org/fullchain.pem ]; then
  echo "Generating self-signed SSL certificate..."
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/crypto.viguri.org/privkey.pem \
    -out /etc/ssl/crypto.viguri.org/fullchain.pem \
    -subj "/C=US/ST=California/L=San Francisco/O=MyCrypto/CN=crypto.viguri.org"
else
  echo "SSL certificate already exists."
fi

# 4. Create Apache configuration with SSL
echo "Creating Apache configuration with SSL..."
cat > /etc/apache2/sites-available/crypto.viguri.org-ssl.conf << 'APACHECONF'
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
    
    # Proxy API requests to the Node.js server using Docker bridge IP
    ProxyPass /api http://172.17.0.1:3003/api
    ProxyPassReverse /api http://172.17.0.1:3003/api
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-ssl-error.log
    CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-ssl-access.log combined
    
    # Set log level to debug temporarily
    LogLevel debug proxy:trace5
</VirtualHost>
APACHECONF

# 5. Enable required Apache modules
echo "Enabling required Apache modules..."
a2enmod ssl proxy proxy_http headers rewrite

# 6. Enable the SSL site
echo "Enabling SSL site..."
a2ensite crypto.viguri.org-ssl

# 7. Test Apache configuration
echo "Testing Apache configuration..."
apache2ctl configtest

# 8. Restart Apache
echo "Restarting Apache..."
systemctl restart apache2

# 9. Create a simple test page to verify proxy functionality
echo "Creating a test page to verify proxy functionality..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/test
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/test/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
  <title>MyCrypto API Test</title>
  <script>
    function testApi() {
      fetch('/api/test')
        .then(response => {
          if (!response.ok) {
            throw new Error('API request failed with status: ' + response.status);
          }
          return response.text();
        })
        .then(data => {
          document.getElementById('result').textContent = 'API Test Successful: ' + data;
          document.getElementById('result').style.color = 'green';
        })
        .catch(error => {
          document.getElementById('result').textContent = 'API Test Failed: ' + error.message;
          document.getElementById('result').style.color = 'red';
        });
    }
  </script>
</head>
<body>
  <h1>MyCrypto API Test</h1>
  <button onclick="testApi()">Test API</button>
  <div id="result" style="margin-top: 20px; font-weight: bold;"></div>
</body>
</html>
HTML

# 10. Test the API endpoint with curl
echo "Testing API endpoint with curl..."
curl -k -s https://crypto.viguri.org/api/test || echo "Failed to connect to API endpoint"

echo "SSL setup completed!"
echo "Please try accessing https://crypto.viguri.org/test/ in your browser and click the 'Test API' button."
echo "Note: You will need to accept the browser warning about the self-signed certificate."
