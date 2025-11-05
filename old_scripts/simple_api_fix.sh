#!/bin/bash
set -e

# Simple API Fix Script for MyCrypto
# This script directly creates the necessary files on the server

echo "Creating simple API fix script for MyCrypto..."

# Create vhost.conf content
VHOST_CONF="# API Proxy Configuration
<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
    
    # Proxy API requests to the Node.js server
    ProxyPass /api http://127.0.0.1:3003/api
    ProxyPassReverse /api http://127.0.0.1:3003/api
    
    # Alternative proxy using Docker bridge IP
    <Location /api>
        ProxyPass http://172.17.0.1:3003/api
        ProxyPassReverse http://172.17.0.1:3003/api
        
        # CORS headers
        Header always set Access-Control-Allow-Origin \"*\"
        Header always set Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\"
        Header always set Access-Control-Allow-Headers \"Origin, X-Requested-With, Content-Type, Accept, Authorization\"
        
        # Handle OPTIONS requests
        RewriteEngine On
        RewriteCond %{REQUEST_METHOD} OPTIONS
        RewriteRule ^(.*)$ $1 [R=200,L]
    </Location>
</IfModule>

# Allow .htaccess files
<Directory /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>"

# Create test HTML content
TEST_HTML="<!DOCTYPE html>
<html>
<head>
  <title>MyCrypto API Test</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto; }
  </style>
</head>
<body>
  <div class=\"container\">
    <h1>MyCrypto API Test</h1>
    
    <h2>API Test</h2>
    <button onclick=\"testApi('/api/test')\">Test API</button>
    <button onclick=\"testApi('/api/blockchain')\">Test Blockchain API</button>
    <button onclick=\"testWallet()\">Test Wallet Creation</button>
    <div id=\"result\" style=\"margin-top: 20px;\"></div>
    <pre id=\"response\"></pre>
    
    <script>
      function testApi(endpoint) {
        const resultElement = document.getElementById('result');
        const responseElement = document.getElementById('response');
        
        resultElement.textContent = 'Testing ' + endpoint + '...';
        resultElement.className = '';
        responseElement.textContent = '';
        
        fetch(endpoint)
          .then(response => {
            if (!response.ok) {
              throw new Error('API request failed with status: ' + response.status);
            }
            return response.text();
          })
          .then(data => {
            resultElement.textContent = 'API Test Successful!';
            resultElement.className = 'success';
            responseElement.textContent = data;
          })
          .catch(error => {
            resultElement.textContent = 'API Test Failed: ' + error.message;
            resultElement.className = 'error';
            responseElement.textContent = 'Error details: ' + error;
            console.error('API Error:', error);
          });
      }
      
      function testWallet() {
        const resultElement = document.getElementById('result');
        const responseElement = document.getElementById('response');
        
        resultElement.textContent = 'Creating wallet...';
        resultElement.className = '';
        responseElement.textContent = '';
        
        fetch('/api/registration/wallet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({})
        })
          .then(response => {
            if (!response.ok) {
              throw new Error('API request failed with status: ' + response.status);
            }
            return response.text();
          })
          .then(data => {
            resultElement.textContent = 'Wallet Creation Successful!';
            resultElement.className = 'success';
            responseElement.textContent = data;
          })
          .catch(error => {
            resultElement.textContent = 'Wallet Creation Failed: ' + error.message;
            resultElement.className = 'error';
            responseElement.textContent = 'Error details: ' + error;
            console.error('API Error:', error);
          });
      }
    </script>
  </div>
</body>
</html>"

# SSH commands to run on the server
SSH_COMMANDS="mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/conf
echo '$VHOST_CONF' > /var/www/vhosts/viguri.org/crypto.viguri.org/conf/vhost.conf
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs
echo '$TEST_HTML' > /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs/api-test.html
if [ -f \"/usr/local/psa/admin/bin/httpdmng\" ]; then
  /usr/local/psa/admin/bin/httpdmng --reconfigure-all
elif [ -f \"/usr/local/psa/admin/sbin/httpdmng\" ]; then
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  systemctl restart apache2
fi
echo 'API configuration updated. Please visit https://crypto.viguri.org/api-test.html to test the API.'"

echo "SSH commands to run on the server:"
echo "-------------------------------"
echo "sudo bash -c \"$SSH_COMMANDS\""
echo "-------------------------------"
echo ""
echo "Copy the above command and run it on your server after connecting via SSH."
echo "After running the command, visit https://crypto.viguri.org/api-test.html to test the API."
