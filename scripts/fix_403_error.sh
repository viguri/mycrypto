#!/bin/bash
set -e

echo "Creating fix for 403 Forbidden error on crypto.viguri.org..."

# SSH commands to run on the server
SSH_COMMANDS="
# Check if we're in the right directory
cd /var/www/vhosts/viguri.org/crypto.viguri.org || exit 1

# Ensure the symbolic link is correct
echo 'Ensuring symbolic link is correct...'
if [ -L 'httpdocs' ]; then
  rm -f httpdocs
fi
ln -sf client/public httpdocs

# Fix permissions
echo 'Fixing permissions...'
chmod -R 755 client/public
find client/public -type f -exec chmod 644 {} \;

# Create an index.html file if it doesn't exist
echo 'Checking for index.html...'
if [ ! -f 'client/public/index.html' ]; then
  echo 'Creating a basic index.html file...'
  cat > client/public/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
  <title>MyCrypto Application</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <div class=\"container\">
    <h1>MyCrypto Application</h1>
    <p>Welcome to the MyCrypto application!</p>
    
    <h2>API Connection Test</h2>
    <button onclick=\"testApi()\">Test API Connection</button>
    <div id=\"api-result\" style=\"margin-top: 20px;\"></div>
    
    <script>
      function testApi() {
        const resultElement = document.getElementById('api-result');
        resultElement.textContent = 'Testing API connection...';
        resultElement.className = '';
        
        fetch('/api/test')
          .then(response => {
            if (!response.ok) {
              throw new Error('API request failed with status: ' + response.status);
            }
            return response.text();
          })
          .then(data => {
            resultElement.textContent = 'API Test Successful: ' + data;
            resultElement.className = 'success';
          })
          .catch(error => {
            resultElement.textContent = 'API Test Failed: ' + error.message;
            resultElement.className = 'error';
            console.error('API Error:', error);
          });
      }
    </script>
  </div>
</body>
</html>
HTML
fi

# Update Plesk configuration
echo 'Updating Plesk configuration...'
mkdir -p conf
cat > conf/vhost.conf << 'VHOST'
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
        Header always set Access-Control-Allow-Origin \"*\"
        Header always set Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\"
        Header always set Access-Control-Allow-Headers \"Origin, X-Requested-With, Content-Type, Accept, Authorization\"
        
        # Handle OPTIONS requests
        RewriteEngine On
        RewriteCond %{REQUEST_METHOD} OPTIONS
        RewriteRule ^(.*)$ \$1 [R=200,L]
    </Location>
</IfModule>

# Allow directory access
<Directory /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
VHOST

# Apply Plesk configuration
if [ -f \"/usr/local/psa/admin/bin/httpdmng\" ]; then
  /usr/local/psa/admin/bin/httpdmng --reconfigure-all
elif [ -f \"/usr/local/psa/admin/sbin/httpdmng\" ]; then
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  systemctl restart apache2
fi

echo 'Fix applied successfully. Please try accessing https://crypto.viguri.org again.'
"

echo "To fix the 403 Forbidden error, run these commands on the server:"
echo "--------------------------------------------------------------"
echo "ssh viguri@81.169.168.33"
echo "sudo bash -c '$SSH_COMMANDS'"
echo "--------------------------------------------------------------"
echo ""
echo "After running these commands, try accessing https://crypto.viguri.org again."
