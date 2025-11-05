#!/bin/bash

echo "Checking MyCrypto application status and fixing remaining issues..."

# 1. Check if Docker containers are running
echo "Checking Docker containers..."
docker ps | grep cryptoviguriorg-server || {
  echo "Server container not running. Starting containers..."
  cd /var/www/vhosts/viguri.org/crypto.viguri.org
  docker-compose up -d
  sleep 10
}

# 2. Check if the Node.js server is responding
echo "Testing Node.js server directly..."
curl -s http://localhost:3003/api/test && echo " <- Node.js server is working!" || {
  echo "Node.js server not responding. Checking logs..."
  docker logs cryptoviguriorg-server-1 --tail 20
}

# 3. Check Apache proxy configuration
echo "Checking Apache proxy configuration..."
grep -r "ProxyPass.*api" /etc/apache2/sites-available/

# 4. Update Apache configuration to use direct IP
echo "Updating Apache configuration to use direct IP..."
sed -i 's|ProxyPass /api http://127.0.0.1:3003/api|ProxyPass /api http://172.17.0.1:3003/api|g' /etc/apache2/sites-available/crypto.viguri.org.conf
sed -i 's|ProxyPassReverse /api http://127.0.0.1:3003/api|ProxyPassReverse /api http://172.17.0.1:3003/api|g' /etc/apache2/sites-available/crypto.viguri.org.conf

# 5. Add a direct access rule to bypass Plesk's global redirect
echo "Adding direct access rule to bypass global redirect..."
cat > /etc/apache2/conf-available/crypto-direct-access.conf << 'CONF'
# Direct access for crypto.viguri.org without HTTPS redirect
<VirtualHost *:80>
  ServerName crypto.viguri.org
  ServerAlias www.crypto.viguri.org
  
  # Document root
  DocumentRoot /var/www/vhosts/viguri.org/crypto.viguri.org/client/public
  
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
  
  # Proxy API requests to the Node.js server using Docker bridge IP
  ProxyPass /api http://172.17.0.1:3003/api
  ProxyPassReverse /api http://172.17.0.1:3003/api
  
  # Logging
  ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-direct-error.log
  CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-direct-access.log combined
</VirtualHost>
CONF

# 6. Enable the direct access configuration
echo "Enabling direct access configuration..."
a2enconf crypto-direct-access

# 7. Test Apache configuration
echo "Testing Apache configuration..."
apache2ctl configtest

# 8. Restart Apache
echo "Restarting Apache..."
systemctl restart apache2

# 9. Test the API endpoints
echo "Testing API endpoints..."
echo "Testing /api/test endpoint:"
curl -s http://crypto.viguri.org/api/test || echo "Failed to connect to API endpoint"

# 10. Create a simple test page to verify proxy functionality
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
            throw new Error('API request failed');
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

echo "Check and fix completed!"
echo "Please try accessing http://crypto.viguri.org/test/ in your browser and click the 'Test API' button."
