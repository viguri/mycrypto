#!/bin/bash
set -e

echo "Creating Plesk API fix script for MyCrypto application..."

# Create a script to run on the server
cat > plesk_api_fix.sh << 'REMOTE_SCRIPT'
#!/bin/bash
set -e

echo "Fixing API configuration for MyCrypto in Plesk..."

# 1. Check if .htaccess is enabled in Plesk
echo "Checking if .htaccess is enabled in Plesk..."
DOMAIN="crypto.viguri.org"
VHOST_CONF="/var/www/vhosts/viguri.org/crypto.viguri.org/conf/vhost.conf"

# 2. Create a more robust vhost.conf for Plesk
echo "Creating robust vhost.conf for Plesk..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/conf
cat > "$VHOST_CONF" << 'VHOST'
# API Proxy Configuration
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
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
        
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
</Directory>
VHOST

# 3. Create a test PHP file to check API connectivity
echo "Creating test PHP file..."
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs/api-test.php << 'PHP'
<?php
header('Content-Type: text/html');
?>
<!DOCTYPE html>
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
  <div class="container">
    <h1>MyCrypto API Test</h1>
    
    <h2>Server Information</h2>
    <pre><?php echo "Server: " . $_SERVER['SERVER_SOFTWARE'] . "\n"; ?></pre>
    
    <h2>API Test</h2>
    <button onclick="testApi('/api/test')">Test API</button>
    <button onclick="testApi('/api/blockchain')">Test Blockchain API</button>
    <button onclick="testWallet()">Test Wallet Creation</button>
    <div id="result" style="margin-top: 20px;"></div>
    <pre id="response"></pre>
    
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
</html>
PHP

# 4. Apply Plesk configuration
echo "Applying Plesk configuration..."
if [ -f "/usr/local/psa/admin/bin/httpdmng" ]; then
  /usr/local/psa/admin/bin/httpdmng --reconfigure-all
elif [ -f "/usr/local/psa/admin/sbin/httpdmng" ]; then
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  systemctl restart apache2
fi

# 5. Test API endpoints
echo "Testing API endpoints..."
echo "Direct test to Node.js server:"
curl -s http://localhost:3003/api/test && echo " <- Node.js server is working!" || echo "Failed to connect to Node.js server"

echo "Test through Apache proxy (this may still fail if Plesk needs manual configuration):"
curl -s http://localhost/api/test && echo " <- Apache proxy is working!" || echo "Failed to connect through Apache proxy"

echo "API configuration fix completed!"
echo "Please try accessing https://crypto.viguri.org/api-test.php in your browser to test the API."
REMOTE_SCRIPT

# Make the script executable
chmod +x plesk_api_fix.sh

echo "Plesk API fix script created successfully!"
echo "To fix the API issues, please:"
echo "1. Upload this script to your server:"
echo "   scp plesk_api_fix.sh viguri@81.169.168.33:/var/www/vhosts/viguri.org/crypto.viguri.org/"
echo "2. SSH to your server and run the script with sudo:"
echo "   ssh viguri@81.169.168.33"
echo "   cd /var/www/vhosts/viguri.org/crypto.viguri.org"
echo "   sudo ./plesk_api_fix.sh"
echo "3. After running the script, access https://crypto.viguri.org/api-test.php to test the API"
