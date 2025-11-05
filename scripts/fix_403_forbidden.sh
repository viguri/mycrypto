#!/bin/bash

echo "Creating a direct fix for the 403 Forbidden error..."

# SSH command to run on the server
SSH_COMMAND="
# Navigate to the website directory
cd /var/www/vhosts/viguri.org/crypto.viguri.org

# Fix permissions - make sure Apache can read all files
echo 'Fixing permissions...'
find . -type d -exec chmod 755 {} \\;
find . -type f -exec chmod 644 {} \\;

# Create a basic favicon to fix the 404
echo 'Creating favicon.ico...'
cat > client/public/favicon.ico << 'FAVICON'
$(base64 -d <<< 'AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAAAQAABILAAASCwAAAAAAAAAAAAD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wD///8A////AP///wA=')
FAVICON

# Create a proper .htaccess file
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
Header always set Access-Control-Allow-Origin \"*\"
Header always set Access-Control-Allow-Methods \"GET, POST, PUT, DELETE, OPTIONS\"
Header always set Access-Control-Allow-Headers \"Origin, X-Requested-With, Content-Type, Accept, Authorization\"

# Handle OPTIONS requests
RewriteCond %{REQUEST_METHOD} OPTIONS
RewriteRule ^(.*)$ $1 [R=200,L]
HTACCESS

# Update Plesk configuration to allow directory access
echo 'Updating Plesk configuration...'
mkdir -p conf
cat > conf/vhost.conf << 'VHOST'
# Allow directory access
<Directory /var/www/vhosts/viguri.org/crypto.viguri.org/httpdocs>
    Options -Indexes +FollowSymLinks
    AllowOverride All
    Require all granted
</Directory>

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
VHOST

# Apply Plesk configuration
if [ -f \"/usr/local/psa/admin/bin/httpdmng\" ]; then
  /usr/local/psa/admin/bin/httpdmng --reconfigure-all
elif [ -f \"/usr/local/psa/admin/sbin/httpdmng\" ]; then
  /usr/local/psa/admin/sbin/httpdmng --reconfigure-all
else
  systemctl restart apache2
fi

echo 'Checking if the symlink is correct...'
if [ ! -L httpdocs ] || [ \"\$(readlink httpdocs)\" != \"client/public\" ]; then
  echo 'Fixing symbolic link...'
  rm -f httpdocs
  ln -sf client/public httpdocs
fi

echo 'Fix applied. Please try accessing https://crypto.viguri.org again.'
"

echo "To fix the 403 Forbidden error, run these commands on the server:"
echo "--------------------------------------------------------------"
echo "ssh viguri@81.169.168.33"
echo "sudo bash -c '$SSH_COMMAND'"
echo "--------------------------------------------------------------"
echo ""
echo "After running these commands, try accessing https://crypto.viguri.org again."
