#!/bin/bash

echo "Checking Apache configuration..."
echo "================================="

# Check if the site is enabled
echo "Checking if the site is enabled:"
ls -la /etc/apache2/sites-enabled/ | grep crypto

# Check Apache configuration syntax
echo -e "\nChecking Apache configuration syntax:"
apache2ctl -t

# Check if proxy modules are enabled
echo -e "\nChecking if proxy modules are enabled:"
apache2ctl -M | grep proxy

# Check Apache error log
echo -e "\nChecking Apache error log (last 10 lines):"
tail -10 /var/log/apache2/error.log

# Check site-specific error log if it exists
echo -e "\nChecking site-specific error log (last 10 lines):"
if [ -f /var/log/apache2/crypto.viguri.org-error.log ]; then
    tail -10 /var/log/apache2/crypto.viguri.org-error.log
else
    echo "Site-specific error log not found"
fi

# Check if the API is accessible locally
echo -e "\nChecking if API is accessible locally:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/api/test
echo " <- HTTP status code for http://localhost:3003/api/test"

# Check if the Docker container is running
echo -e "\nChecking if Docker container is running:"
docker ps | grep cryptoviguriorg-server

echo -e "\nDone checking Apache configuration."
