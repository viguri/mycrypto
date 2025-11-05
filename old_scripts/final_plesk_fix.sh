#!/bin/bash

echo "Applying final Plesk fix for MyCrypto application..."

# 1. Check if the domain exists in Plesk
echo "Checking domain in Plesk..."
plesk bin domain --info crypto.viguri.org 2>/dev/null || echo "Domain not found in Plesk"

# 2. Create a symbolic link from the Plesk document root to our application
echo "Creating symbolic link to application..."
HTTPDOCS="/var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs"
CLIENT_PUBLIC="/var/www/vhosts/viguri.org/crypto.viguri.org/client/public"

if [ -d "$HTTPDOCS" ]; then
  echo "Backing up existing httpdocs..."
  mv "$HTTPDOCS" "${HTTPDOCS}.bak"
fi

if [ -d "$CLIENT_PUBLIC" ]; then
  echo "Creating symbolic link from httpdocs to client/public..."
  ln -sf "$CLIENT_PUBLIC" "$HTTPDOCS"
else
  echo "Client public directory not found. Creating httpdocs directory..."
  mkdir -p "$HTTPDOCS"
  
  # Copy any existing client files to httpdocs
  find /var/www/vhosts/viguri.org/crypto.viguri.org -path "*/client/public/*" -type f -exec cp -r --parents {} "$HTTPDOCS" \; 2>/dev/null || echo "No client files found"
fi

# 3. Create a test file in the document root
echo "Creating test file..."
cat > "$HTTPDOCS/test.html" << 'HTML'
<!DOCTYPE html>
<html>
<head>
  <title>MyCrypto Test Page</title>
</head>
<body>
  <h1>MyCrypto Test Page</h1>
  <p>If you can see this page, the web server is working correctly.</p>
  <p>Now testing API connection...</p>
  <div id="api-result" style="margin-top: 20px; font-weight: bold;"></div>
  
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const resultElement = document.getElementById('api-result');
      resultElement.textContent = 'Testing API connection...';
      
      fetch('/api/test')
        .then(response => {
          if (!response.ok) {
            throw new Error('API request failed with status: ' + response.status);
          }
          return response.text();
        })
        .then(data => {
          resultElement.textContent = 'API Test Successful: ' + data;
          resultElement.style.color = 'green';
        })
        .catch(error => {
          resultElement.textContent = 'API Test Failed: ' + error.message;
          resultElement.style.color = 'red';
          console.error('API Error:', error);
        });
    });
  </script>
</body>
</html>
HTML

# 4. Create a .htaccess file for Apache
echo "Creating .htaccess file..."
cat > "$HTTPDOCS/.htaccess" << 'HTACCESS'
# API Proxy Configuration
<IfModule mod_proxy.c>
    RewriteEngine On
    
    # Proxy API requests to the Node.js server
    RewriteRule ^api/(.*) http://172.17.0.1:3003/api/$1 [P,L]
    
    # Handle OPTIONS requests for CORS preflight
    RewriteCond %{REQUEST_METHOD} OPTIONS
    RewriteRule ^(.*)$ $1 [R=200,L]
</IfModule>

# SPA Rewrite Rules
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

# CORS headers
<IfModule mod_headers.c>
    Header always set Access-Control-Allow-Origin "*"
    Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
    Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
</IfModule>
HTACCESS

# 5. Update client-side JavaScript to use relative URLs
echo "Updating client-side JavaScript to use relative URLs..."
find "$HTTPDOCS" -type f -name "*.js" -exec grep -l "localhost:3003/api" {} \; | while read file; do
    echo "Updating $file..."
    sed -i 's|http://localhost:3003/api|/api|g' "$file"
    sed -i 's|http://127.0.0.1:3003/api|/api|g' "$file"
done

# 6. Create a direct proxy configuration for Apache
echo "Creating direct proxy configuration..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/conf
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/conf/vhost.conf << 'CONF'
# Allow .htaccess files
<Directory /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>

# Enable proxy modules
<IfModule !mod_proxy.c>
    LoadModule proxy_module modules/mod_proxy.so
</IfModule>
<IfModule !mod_proxy_http.c>
    LoadModule proxy_http_module modules/mod_proxy_http.so
</IfModule>
<IfModule !mod_rewrite.c>
    LoadModule rewrite_module modules/mod_rewrite.so
</IfModule>
<IfModule !mod_headers.c>
    LoadModule headers_module modules/mod_headers.so
</IfModule>

# API Proxy Configuration
<IfModule mod_proxy.c>
    ProxyRequests Off
    ProxyPreserveHost On
    
    # Proxy API requests to the Node.js server
    ProxyPass /api http://172.17.0.1:3003/api
    ProxyPassReverse /api http://172.17.0.1:3003/api
</IfModule>
CONF

# 7. Restart Apache
echo "Restarting Apache..."
if [ -f "/usr/local/psa/admin/sbin/httpdmng" ]; then
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  systemctl restart apache2
fi

# 8. Test the API endpoint
echo "Testing API endpoint..."
echo "Testing direct Node.js server access:"
curl -s http://localhost:3003/api/test && echo " <- Node.js server is working!" || echo "Failed to connect to Node.js server"

echo "Testing through web server (this may still fail if Plesk needs manual configuration):"
curl -k -s https://crypto.viguri.org/api/test && echo " <- API proxy is working!" || echo "Failed to connect through web server"

echo "Final Plesk fix applied!"
echo "Please try accessing https://crypto.viguri.org/test.html in your browser."
echo "Note: You may need to accept the browser warning about the self-signed certificate."
echo ""
echo "IMPORTANT: If the test page still doesn't work, you'll need to manually configure the domain in Plesk:"
echo "1. Log in to the Plesk control panel"
echo "2. Go to Domains > crypto.viguri.org"
echo "3. Click on Apache & nginx Settings"
echo "4. Enable 'Allow use of .htaccess files' and 'Allow symbolic links'"
echo "5. Save changes and restart the web server"
