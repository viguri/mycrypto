#!/bin/bash

# Create scripts directory if it doesn't exist
mkdir -p scripts

# Essential deployment scripts
echo "Moving essential deployment scripts..."
cp deploy_to_viguri_fixed.sh scripts/deploy.sh
chmod +x scripts/deploy.sh

# Docker management scripts
echo "Moving Docker management scripts..."
cp restart_containers.sh scripts/restart_containers.sh
cp healthcheck.sh scripts/healthcheck.sh
chmod +x scripts/restart_containers.sh scripts/healthcheck.sh

# Logging scripts
echo "Moving logging scripts..."
cp check_logs.sh scripts/check_logs.sh
chmod +x scripts/check_logs.sh

# API and server scripts
echo "Moving API and server scripts..."
cp fix_permissions.sh scripts/fix_permissions.sh
cp simple_api_fix.sh scripts/fix_api.sh
chmod +x scripts/fix_permissions.sh scripts/fix_api.sh

# Create a README file for the scripts directory
cat > scripts/README.md << 'README'
# MyCrypto Scripts

This directory contains essential scripts for managing the MyCrypto application.

## Deployment

- `deploy.sh` - Main deployment script for updating the application on the server

## Docker Management

- `restart_containers.sh` - Restart Docker containers
- `healthcheck.sh` - Check the health of Docker containers

## Logging

- `check_logs.sh` - View and analyze application logs

## Maintenance

- `fix_permissions.sh` - Fix permissions for logs and other directories
- `fix_api.sh` - Fix API proxy configuration issues

## Usage

All scripts are executable. Run them from the project root directory:

```bash
./scripts/deploy.sh
```
README

echo "Scripts organized successfully!"
echo "You can now safely remove the unnecessary scripts."
