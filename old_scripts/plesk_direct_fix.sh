#!/bin/bash

echo "Applying direct Plesk fix for MyCrypto application..."

# 1. Check Plesk version and configuration
echo "Checking Plesk configuration..."
plesk version 2>/dev/null || echo "Plesk command not found"

# 2. Find the correct document root
echo "Finding document root..."
DOCROOT=$(find /var/www/vhosts -path "*/httpdocs" -type d | grep -i "crypto.viguri.org" | head -n 1)
if [ -z "$DOCROOT" ]; then
  echo "Document root not found. Using default path."
  DOCROOT="/var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs"
  mkdir -p "$DOCROOT"
fi
echo "Document root: $DOCROOT"

# 3. Copy client files to the correct location
echo "Copying client files to document root..."
if [ -d "/var/www/vhosts/viguri.org/crypto.viguri.org/client/public" ]; then
  cp -r /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/* "$DOCROOT/"
  echo "Client files copied successfully."
else
  echo "Client public directory not found."
fi

# 4. Create a test file in the document root
echo "Creating test file..."
cat > "$DOCROOT/test.html" << 'HTML'
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

# 5. Create a direct Apache configuration file
echo "Creating direct Apache configuration..."
CONF_DIR=$(find /var/www/vhosts -path "*/conf" -type d | grep -i "crypto.viguri.org" | head -n 1)
if [ -z "$CONF_DIR" ]; then
  echo "Configuration directory not found. Using default path."
  CONF_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org/conf"
  mkdir -p "$CONF_DIR"
fi
echo "Configuration directory: $CONF_DIR"

cat > "$CONF_DIR/vhost.conf" << 'CONF'
# Direct Apache configuration for crypto.viguri.org
<IfModule mod_proxy.c>
    # API Proxy Configuration
    ProxyRequests Off
    ProxyPreserveHost On
    
    # Proxy API requests to the Node.js server
    ProxyPass /api http://172.17.0.1:3003/api
    ProxyPassReverse /api http://172.17.0.1:3003/api
    
    # Add CORS headers for API requests
    <Location /api>
        Header always set Access-Control-Allow-Origin "*"
        Header always set Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS"
        Header always set Access-Control-Allow-Headers "Origin, X-Requested-With, Content-Type, Accept, Authorization"
    </Location>
</IfModule>
CONF

# 6. Create a direct nginx configuration file (in case Plesk uses nginx)
echo "Creating nginx configuration..."
cat > "$CONF_DIR/nginx.conf" << 'CONF'
# Direct nginx configuration for crypto.viguri.org
location /api {
    proxy_pass http://172.17.0.1:3003;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # CORS headers
    add_header 'Access-Control-Allow-Origin' '*' always;
    add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
    add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization' always;
    
    # Handle OPTIONS requests
    if ($request_method = 'OPTIONS') {
        add_header 'Access-Control-Allow-Origin' '*';
        add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
        add_header 'Access-Control-Allow-Headers' 'Origin, X-Requested-With, Content-Type, Accept, Authorization';
        add_header 'Content-Type' 'text/plain charset=UTF-8';
        add_header 'Content-Length' 0;
        return 204;
    }
}
CONF

# 7. Update client-side JavaScript to use relative URLs
echo "Updating client-side JavaScript to use relative URLs..."
find "$DOCROOT" -type f -name "*.js" -exec grep -l "localhost:3003/api" {} \; | while read file; do
    echo "Updating $file..."
    sed -i 's|http://localhost:3003/api|/api|g' "$file"
    sed -i 's|http://127.0.0.1:3003/api|/api|g' "$file"
done

# 8. Apply Plesk configuration
echo "Applying Plesk configuration..."
if command -v plesk >/dev/null 2>&1; then
    plesk bin apache_configurator --reconfigure-all
    plesk bin nginx_configurator --reconfigure-all
    plesk sbin httpdmng --reconfigure-all
else
    echo "Plesk command not found. Restarting Apache manually..."
    systemctl restart apache2
fi

# 9. Test the API endpoint
echo "Testing API endpoint..."
echo "Testing direct Node.js server access:"
curl -s http://localhost:3003/api/test || echo "Failed to connect to Node.js server"

echo "Testing through web server (this may fail if Plesk needs to be reconfigured):"
curl -k -s https://crypto.viguri.org/api/test || echo "Failed to connect through web server"

echo "Direct Plesk fix applied!"
echo "Please try accessing https://crypto.viguri.org/test.html in your browser."
echo "Note: You may need to accept the browser warning about the self-signed certificate."
echo "If the test page doesn't work, please check the Plesk control panel and ensure that:"
echo "1. The domain crypto.viguri.org is properly configured"
echo "2. The document root is set to the correct directory"
echo "3. The SSL certificate is properly installed"
