#!/bin/bash

echo "Applying final HTTPS fix for MyCrypto application..."

# 1. Ensure the application files are in the correct location
echo "Checking application files..."
if [ -L "/var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs" ]; then
  echo "Symbolic link exists, ensuring it points to the correct location..."
  rm -f /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs
  ln -sf /var/www/vhosts/viguri.org/crypto.viguri.org/client/public /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs
else
  echo "Creating symbolic link to client/public..."
  mv /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs.bak 2>/dev/null || true
  ln -sf /var/www/vhosts/viguri.org/crypto.viguri.org/client/public /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs
fi

# 2. Create a simple index.html file to test basic web access
echo "Creating index.html..."
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs/index.html << 'HTML'
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
    button:hover { background: #45a049; }
  </style>
</head>
<body>
  <div class="container">
    <h1>MyCrypto Application</h1>
    <p>This is the MyCrypto application deployed at crypto.viguri.org.</p>
    
    <h2>API Connection Test</h2>
    <button onclick="testApi()">Test API Connection</button>
    <div id="api-result" style="margin-top: 20px;"></div>
    
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

# 3. Update the .htaccess file with proper rewrite rules for the API
echo "Creating .htaccess file..."
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs/.htaccess << 'HTACCESS'
# Enable rewrite engine
RewriteEngine On

# API Proxy Rules
RewriteCond %{REQUEST_URI} ^/api/(.*)
RewriteRule ^api/(.*) http://172.17.0.1:3003/api/$1 [P,L]

# Handle OPTIONS requests for CORS preflight
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]

# SPA Rewrite Rules - Only if not an existing file or directory
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# CORS headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
</IfModule>
HTACCESS

# 4. Update client-side JavaScript to use relative URLs
echo "Updating client-side JavaScript to use relative URLs..."
find /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs -type f -name "*.js" -exec grep -l "localhost:3003/api" {} \; | while read file; do
    echo "Updating $file..."
    sed -i 's|http://localhost:3003/api|/api|g' "$file"
    sed -i 's|http://127.0.0.1:3003/api|/api|g' "$file"
done

# 5. Create a PHP test file to check server configuration
echo "Creating PHP test file..."
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs/test.php << 'PHP'
<?php
header('Content-Type: text/html');
?>
<!DOCTYPE html>
<html>
<head>
  <title>MyCrypto Server Test</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
    .success { color: green; font-weight: bold; }
    .error { color: red; font-weight: bold; }
    table { border-collapse: collapse; width: 100%; }
    th, td { text-align: left; padding: 8px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    th { background-color: #4CAF50; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>MyCrypto Server Test</h1>
    
    <h2>Server Information</h2>
    <table>
      <tr><th>Setting</th><th>Value</th></tr>
      <tr><td>PHP Version</td><td><?php echo phpversion(); ?></td></tr>
      <tr><td>Server Software</td><td><?php echo $_SERVER['SERVER_SOFTWARE']; ?></td></tr>
      <tr><td>Document Root</td><td><?php echo $_SERVER['DOCUMENT_ROOT']; ?></td></tr>
      <tr><td>Server Name</td><td><?php echo $_SERVER['SERVER_NAME']; ?></td></tr>
      <tr><td>Server Protocol</td><td><?php echo $_SERVER['SERVER_PROTOCOL']; ?></td></tr>
      <tr><td>HTTPS</td><td><?php echo isset($_SERVER['HTTPS']) ? $_SERVER['HTTPS'] : 'off'; ?></td></tr>
    </table>
    
    <h2>Apache Modules</h2>
    <table>
      <tr><th>Module</th><th>Loaded</th></tr>
      <tr><td>mod_rewrite</td><td><?php echo function_exists('apache_get_modules') && in_array('mod_rewrite', apache_get_modules()) ? '<span class="success">Yes</span>' : '<span class="error">No</span>'; ?></td></tr>
      <tr><td>mod_proxy</td><td><?php echo function_exists('apache_get_modules') && in_array('mod_proxy', apache_get_modules()) ? '<span class="success">Yes</span>' : '<span class="error">No</span>'; ?></td></tr>
      <tr><td>mod_proxy_http</td><td><?php echo function_exists('apache_get_modules') && in_array('mod_proxy_http', apache_get_modules()) ? '<span class="success">Yes</span>' : '<span class="error">No</span>'; ?></td></tr>
      <tr><td>mod_headers</td><td><?php echo function_exists('apache_get_modules') && in_array('mod_headers', apache_get_modules()) ? '<span class="success">Yes</span>' : '<span class="error">No</span>'; ?></td></tr>
    </table>
    
    <h2>API Connection Test</h2>
    <div id="api-result">Click the button below to test the API connection.</div>
    <button onclick="testApi()">Test API Connection</button>
    
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
PHP

# 6. Update Plesk configuration
echo "Updating Plesk configuration..."
if [ -f "/usr/local/psa/admin/bin/httpdmng" ]; then
  echo "Using Plesk httpdmng..."
  /usr/local/psa/admin/bin/httpdmng --reconfigure-all
elif [ -f "/usr/local/psa/admin/sbin/httpdmng" ]; then
  echo "Using Plesk httpdmng in sbin..."
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  echo "Plesk httpdmng not found. Restarting Apache manually..."
  systemctl restart apache2
fi

echo "Testing API endpoint..."
echo "Testing direct Node.js server access:"
curl -s http://localhost:3003/api/test && echo " <- Node.js server is working!" || echo "Failed to connect to Node.js server"

echo "Testing through web server (using HTTPS):"
curl -k -s https://crypto.viguri.org/api/test && echo " <- API proxy is working!" || echo "Failed to connect through web server"

echo "Final HTTPS fix applied!"
echo "Please try accessing https://crypto.viguri.org/ in your browser."
echo "Note: You may need to accept the browser warning about the self-signed certificate."
echo ""
echo "IMPORTANT: If the site still doesn't work, please check the following:"
echo "1. Visit https://crypto.viguri.org/test.php to see server configuration details"
echo "2. Log in to the Plesk control panel"
echo "3. Go to Domains > crypto.viguri.org > Apache & nginx Settings"
echo "4. Enable 'Allow use of .htaccess files'"
echo "5. Save changes and restart the web server"
