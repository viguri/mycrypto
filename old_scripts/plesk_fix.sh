#!/bin/bash
set -e

echo "Applying Plesk-specific fix for MyCrypto application..."

# 1. Check if we're running in a Plesk environment
echo "Checking for Plesk..."
if [ -d "/usr/local/psa" ]; then
  echo "Plesk detected. Using Plesk-specific configuration."
  
  # 2. Find the Plesk domain configuration
  echo "Finding Plesk domain configuration..."
  DOMAIN_CONF=$(find /var/www/vhosts -name "vhost.conf" | grep -i "crypto.viguri.org" || echo "Not found")
  
  if [ "$DOMAIN_CONF" != "Not found" ]; then
    echo "Found domain configuration at $DOMAIN_CONF"
    echo "Current configuration:"
    cat "$DOMAIN_CONF"
    
    # 3. Create a Plesk-compatible vhost.conf
    echo "Creating Plesk-compatible vhost.conf..."
    cat > "$DOMAIN_CONF" << 'PLESKCONF'
# Plesk vhost configuration for crypto.viguri.org
<IfModule mod_proxy.c>
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
</IfModule>

# SPA Rewrite Rules
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
PLESKCONF
  else
    echo "Domain configuration not found. Creating a new one..."
    mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/conf
    cat > /var/www/vhosts/viguri.org/crypto.viguri.org/conf/vhost.conf << 'PLESKCONF'
# Plesk vhost configuration for crypto.viguri.org
<IfModule mod_proxy.c>
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
</IfModule>

# SPA Rewrite Rules
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /
    RewriteRule ^index\.html$ - [L]
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule . /index.html [L]
</IfModule>
PLESKCONF
  fi
else
  echo "Plesk not detected. Using standard Apache configuration."
fi

# 4. Update client-side JavaScript to use relative URLs
echo "Updating client-side JavaScript to use relative URLs..."
find /var/www/vhosts/viguri.org/crypto.viguri.org -type f -name "*.js" -exec grep -l "localhost:3003/api" {} \; | while read file; do
    echo "Updating $file..."
    sed -i 's|http://localhost:3003/api|/api|g' "$file"
    sed -i 's|http://127.0.0.1:3003/api|/api|g' "$file"
done

# 5. Restart Apache
echo "Restarting Apache..."
if [ -f "/usr/local/psa/admin/sbin/httpdmng" ]; then
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  systemctl restart apache2
fi

# 6. Create a test file in the document root
echo "Creating test files..."
mkdir -p /var/www/vhosts/viguri.org/crypto.viguri.org/client/public
cat > /var/www/vhosts/viguri.org/crypto.viguri.org/client/public/test.html << 'HTML'
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

# 7. Test the API endpoint
echo "Testing API endpoint..."
echo "Testing direct Node.js server access:"
curl -s http://localhost:3003/api/test || echo "Failed to connect to Node.js server"

echo "Testing through Apache proxy (this may fail if Plesk needs to be reconfigured):"
curl -k -s https://crypto.viguri.org/api/test || echo "Failed to connect through Apache proxy"

echo "Plesk-specific fix applied!"
echo "Please try accessing https://crypto.viguri.org/test.html in your browser."
echo "Note: You may need to accept the browser warning about the self-signed certificate."
echo "If the test page doesn't work, you may need to reconfigure the domain in Plesk."
