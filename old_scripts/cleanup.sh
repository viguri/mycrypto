#!/bin/bash
# Cleanup script to remove unnecessary files for production deployment

# Create a backup directory
mkdir -p backup

# Move development and temporary files to backup
echo "Moving development and temporary files to backup..."
mv docker-compose.yml backup/
mv docker-compose.cli.yml backup/
mv jest.config.cjs backup/
mv jest.config.js backup/
mv config.env.example backup/
mv check_logs.sh backup/
mv create_logs_route.sh backup/
mv fix_permissions.sh backup/
mv fix_server_logging.sh backup/
mv restart_containers.sh backup/
mv transfer_script.sh backup/
mv Dockerfile.fixed backup/
mv docker-compose.prod.yml.fixed backup/
mv DEPLOYMENT.md backup/

# Move test files to backup
echo "Moving test files to backup..."
mv tests backup/

# Move old source structure to backup if it's not being used
echo "Moving old source structure to backup..."
mv src backup/

# Remove macOS system files
echo "Removing system files..."
find . -name ".DS_Store" -delete

# Keep essential files for production
echo "Keeping essential files for production:"
echo "- server/ (Backend code)"
echo "- client/ (Frontend code)"
echo "- cli/ (CLI tool)"
echo "- Dockerfile"
echo "- Dockerfile.cli"
echo "- docker-compose.prod.yml"
echo "- config.env.production"
echo "- package.json and package-lock.json"
echo "- babel.config.cjs"
echo "- nginx/crypto.viguri.org.conf"
echo "- mycrypto.service"
echo "- README.md"
echo "- TROUBLESHOOTING.md"
echo "- DEVELOPMENT_GUIDE.md"
echo "- wallets.json"
echo "- deploy.sh (for deployment)"
echo "- deploy_to_viguri.sh (for deployment)"
echo "- server_setup.sh (for deployment)"
echo "- UBUNTU_DEPLOYMENT.md (for deployment)"

echo "Cleanup complete! Unnecessary files have been moved to the backup directory."
echo "You can review the backup directory and delete it when you're confident everything is working correctly."
