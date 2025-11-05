#!/bin/bash

echo "Creating a comprehensive fix for server access issues..."

# SSH commands to run on the server
SSH_COMMANDS="
# Check if we're in the right directory
cd /var/www/vhosts/viguri.org/crypto.viguri.org || exit 1

echo 'Current directory structure:'
ls -la

# Ensure the symbolic link is correct
echo 'Ensuring symbolic link is correct...'
if [ -L 'httpdocs' ]; then
  rm -f httpdocs
fi
ln -sf client/public httpdocs

# Fix permissions
echo 'Fixing permissions...'
chmod -R 755 client/public server/public
find client/public server/public -type f -exec chmod 644 {} \;

# Create a diagnostic page
echo 'Creating a diagnostic page...'
cat > client/public/diagnostic.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
  <title>MyCrypto Diagnostic</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    button { padding: 10px 15px; background: #4CAF50; color: white; border: none; cursor: pointer; margin-right: 10px; }
    pre { background: #f4f4f4; padding: 10px; border-radius: 5px; overflow: auto; }
  </style>
</head>
<body>
  <div class=\"container\">
    <h1>MyCrypto Diagnostic Page</h1>
    <p>This page helps diagnose connection issues with the MyCrypto application.</p>
    
    <h2>API Connection Tests</h2>
    <div>
      <button onclick=\"testApi('/api/test')\">Test Basic API</button>
      <button onclick=\"testApi('/api/health')\">Test Health Endpoint</button>
      <button onclick=\"testDirectApi()\">Test Direct API (Port 3003)</button>
    </div>
    <div id=\"api-result\" style=\"margin-top: 20px;\"></div>
    
    <h2>Server Information</h2>
    <pre id=\"server-info\">
User Agent: <script>document.write(navigator.userAgent)</script>
Protocol: <script>document.write(window.location.protocol)</script>
Host: <script>document.write(window.location.host)</script>
Pathname: <script>document.write(window.location.pathname)</script>
    </pre>
    
    <h2>Navigation</h2>
    <p>
      <a href=\"/\">Home Page</a> | 
      <a href=\"/test.html\">Test Page</a> | 
      <a href=\"/diagnostic.html\">Diagnostic Page</a>
    </p>
    
    <script>
      function testApi(endpoint) {
        const resultElement = document.getElementById('api-result');
        resultElement.textContent = 'Testing API connection to ' + endpoint + '...';
        resultElement.className = '';
        
        fetch(endpoint)
          .then(response => {
            if (!response.ok) {
              throw new Error('API request failed with status: ' + response.status);
            }
            return response.json();
          })
          .then(data => {
            resultElement.textContent = 'API Test Successful: ' + JSON.stringify(data);
            resultElement.className = 'success';
          })
          .catch(error => {
            resultElement.textContent = 'API Test Failed: ' + error.message;
            resultElement.className = 'error';
            console.error('API Error:', error);
          });
      }
      
      function testDirectApi() {
        const resultElement = document.getElementById('api-result');
        resultElement.textContent = 'Testing direct API connection on port 3003...';
        resultElement.className = '';
        
        // Create a script element to test JSONP
        const script = document.createElement('script');
        script.src = 'http://' + window.location.hostname + ':3003/api/test?callback=handleDirectApiResponse';
        document.body.appendChild(script);
        
        // Set a timeout in case the script doesn't load
        window.directApiTimeout = setTimeout(() => {
          resultElement.textContent = 'Direct API Test Failed: Timeout - No response received';
          resultElement.className = 'error';
        }, 5000);
      }
      
      // Callback function for JSONP
      window.handleDirectApiResponse = function(data) {
        clearTimeout(window.directApiTimeout);
        const resultElement = document.getElementById('api-result');
        resultElement.textContent = 'Direct API Test Successful: ' + JSON.stringify(data);
        resultElement.className = 'success';
      };
    </script>
  </div>
</body>
</html>
HTML

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

# SPA routing
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    
    # Don't rewrite files or directories
    RewriteCond %{REQUEST_FILENAME} -f [OR]
    RewriteCond %{REQUEST_FILENAME} -d
    RewriteRule ^ - [L]
    
    # Rewrite everything else to index.html
    RewriteRule ^ index.html [L]
</IfModule>

# Allow directory access
<Directory /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>
VHOST

# Create .htaccess file
echo 'Creating .htaccess file...'
cat > httpdocs/.htaccess << 'HTACCESS'
# Enable rewriting
RewriteEngine On

# API proxy
RewriteRule ^api/(.*) http://172.17.0.1:3003/api/$1 [P,L]

# SPA routing
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# CORS headers
Header always set Access-Control-Allow-Origin "*"
Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"

# Handle OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
HTACCESS

# Restart Docker containers to ensure they're running
echo 'Restarting Docker containers...'
cd /var/www/vhosts/viguri.org/crypto.viguri.org
docker-compose down
docker-compose up -d

# Apply Plesk configuration
echo 'Applying Plesk configuration...'
if [ -f \"/usr/local/psa/admin/bin/httpdmng\" ]; then
  /usr/local/psa/admin/bin/httpdmng --reconfigure-all
elif [ -f \"/usr/local/psa/admin/sbin/httpdmng\" ]; then
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  systemctl restart apache2
fi

echo 'Fix applied successfully. Please try accessing https://crypto.viguri.org again.'
echo 'For diagnostics, visit https://crypto.viguri.org/diagnostic.html'
"

echo "To fix the server access issues, run these commands on the server:"
echo "--------------------------------------------------------------"
echo "ssh viguri@81.169.168.33"
echo "sudo bash -c '$SSH_COMMANDS'"
echo "--------------------------------------------------------------"
echo ""
echo "After running these commands, try accessing https://crypto.viguri.org again."
echo "For diagnostics, visit https://crypto.viguri.org/diagnostic.html"
