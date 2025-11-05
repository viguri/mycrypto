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
