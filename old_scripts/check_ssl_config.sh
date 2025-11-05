#!/bin/bash

echo "Checking SSL/TLS configuration..."
echo "================================="

# Check if SSL module is enabled
echo "Checking if SSL module is enabled:"
apache2ctl -M | grep ssl

# Check if port 443 is listening
echo -e "\nChecking if port 443 is listening:"
netstat -tuln | grep :443

# Check if there's an SSL VirtualHost configuration
echo -e "\nChecking for SSL VirtualHost configuration:"
grep -r "VirtualHost.*:443" /etc/apache2/sites-enabled/

# Check if Let's Encrypt certificates exist
echo -e "\nChecking if Let's Encrypt certificates exist:"
ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No Let's Encrypt certificates found"

echo -e "\nDone checking SSL/TLS configuration."
