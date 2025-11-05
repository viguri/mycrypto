# MyCrypto Application Deployment Guide

This document outlines the deployment process for the MyCrypto application to the production server at crypto.viguri.org.

## Table of Contents
1. [System Requirements](#system-requirements)
2. [Deployment Architecture](#deployment-architecture)
3. [Deployment Steps](#deployment-steps)
4. [Configuration Files](#configuration-files)
5. [Troubleshooting](#troubleshooting)
6. [Maintenance](#maintenance)

## System Requirements

- **Server**: Ubuntu Linux server
- **Docker**: Version 20.10 or higher
- **Docker Compose**: Version 2.0 or higher
- **Apache Web Server**: Version 2.4 or higher
- **Node.js**: Version 20.x (managed via Docker)

## Deployment Architecture

The MyCrypto application uses a client/server architecture with the following components:

- **Client**: Static HTML/CSS/JavaScript files served by Apache
- **Server**: Node.js application running in a Docker container
- **Apache**: Web server acting as a reverse proxy for the API
- **Docker**: Container runtime for the server and CLI components

### Port Configuration
- **Apache**: Port 80 (HTTP)
- **Node.js Server**: Port 3003 (internal)

## Deployment Steps

### 1. Prepare the Server Environment

Ensure the server has Docker, Docker Compose, and Apache installed:

```bash
# Check Docker installation
docker --version
docker-compose --version

# Check Apache installation
apache2 -v
```

### 2. Deploy the Application Files

Transfer the application files to the server:

```bash
# From local development machine
./deploy_to_viguri.sh
```

This script:
- Packages the application
- Transfers it to the server
- Extracts it to the correct location

### 3. Configure Docker Containers

The application uses Docker Compose to manage containers:

```bash
# Navigate to the application directory
cd /var/www/vhosts/viguri.org/crypto.viguri.org

# Build and start the containers
docker-compose down
docker-compose build server
docker-compose up -d
```

### 4. Configure Apache Web Server

Set up Apache to serve the client files and proxy API requests:

```bash
# Run the Apache setup script
sudo /var/www/vhosts/viguri.org/crypto.viguri.org/setup_apache_no_ssl.sh
```

This script:
- Creates the Apache configuration file
- Enables necessary Apache modules
- Configures the virtual host
- Reloads Apache to apply changes

## Configuration Files

### Docker Compose Configuration

File: `/var/www/vhosts/viguri.org/crypto.viguri.org/docker-compose.yml`

```yaml
version: '3.8'

services:
  server:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: cryptoviguriorg-server-1
    restart: unless-stopped
    ports:
      - "3003:3003"
    volumes:
      - /var/www/vhosts/viguri.org/crypto.viguri.org/logs:/app/logs
      - ./server/storage:/app/server/storage
    environment:
      - NODE_ENV=production
      - PORT=3003
      - ALLOWED_ORIGINS=https://crypto.viguri.org,http://localhost:3003,http://localhost:8080,http://server:3003
      - LOG_LEVEL=info
      - BLOCKCHAIN_DIFFICULTY=4
    healthcheck:
      test: ["CMD", "/healthcheck.sh"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  cli:
    build:
      context: .
      dockerfile: Dockerfile.cli
    container_name: cryptoviguriorg-cli-1
    depends_on:
      server:
        condition: service_healthy
    volumes:
      - ./cli-data:/app/cli-data
    environment:
      - NODE_ENV=production
      - SERVER_URL=http://server:3003
```

### Apache Configuration

File: `/etc/apache2/sites-available/crypto.viguri.org.conf`

```apache
<VirtualHost *:80>
    ServerName crypto.viguri.org
    ServerAlias www.crypto.viguri.org
    
    # Document root
    DocumentRoot /var/www/vhosts/viguri.org/crypto.viguri.org/client/public
    
    # Security headers
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "DENY"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "no-referrer-when-downgrade"
    
    # Directory configuration
    <Directory /var/www/vhosts/viguri.org/crypto.viguri.org/client/public>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
        
        # Rewrite rules for SPA
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # API Proxy
    ProxyRequests Off
    ProxyPreserveHost On
    
    <Location /api>
        ProxyPass http://localhost:3003/api
        ProxyPassReverse http://localhost:3003/api
    </Location>
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/crypto.viguri.org-error.log
    CustomLog ${APACHE_LOG_DIR}/crypto.viguri.org-access.log combined
</VirtualHost>
```

## Troubleshooting

### Docker Container Issues

If the Docker containers are not starting properly:

```bash
# Check container status
docker ps -a

# View container logs
docker logs cryptoviguriorg-server-1

# Restart containers
docker-compose down
docker-compose up -d
```

### Apache Configuration Issues

If the Apache configuration is not working:

```bash
# Check Apache configuration syntax
sudo apache2ctl configtest

# Check Apache error logs
sudo tail -f /var/log/apache2/error.log

# Check application-specific logs
sudo tail -f /var/log/apache2/crypto.viguri.org-error.log
```

### Application Logs

Application logs are stored in:

```
/var/www/vhosts/viguri.org/crypto.viguri.org/logs/app.log
```

You can view them with:

```bash
tail -f /var/www/vhosts/viguri.org/crypto.viguri.org/logs/app.log
```

Or through the API:

```
http://crypto.viguri.org/api/logs
```

## Maintenance

### Updating the Application

To update the application:

1. Run the deployment script with the new version:
   ```bash
   ./deploy_to_viguri.sh
   ```

2. Rebuild and restart the Docker containers:
   ```bash
   cd /var/www/vhosts/viguri.org/crypto.viguri.org
   docker-compose down
   docker-compose build server
   docker-compose up -d
   ```

### Backup

Important files to backup:

- `/var/www/vhosts/viguri.org/crypto.viguri.org/server/storage` - Contains blockchain data and wallets
- `/var/www/vhosts/viguri.org/crypto.viguri.org/logs` - Contains application logs

### Health Checks

The application has built-in health checks:

- Docker health check: Verifies the Node.js process is running
- API health endpoint: `http://crypto.viguri.org/api/test`

### Adding SSL (Future Enhancement)

To add SSL support:

1. Obtain SSL certificates (e.g., from Let's Encrypt)
2. Update the Apache configuration to use SSL
3. Enable the SSL module in Apache
4. Update the ALLOWED_ORIGINS environment variable in docker-compose.yml

## Conclusion

The MyCrypto application is now deployed and accessible at http://crypto.viguri.org. The API is available at http://crypto.viguri.org/api/.
