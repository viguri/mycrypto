#!/bin/bash

# Create a backup directory for the old scripts
mkdir -p old_scripts

# Move all .sh files except the ones in the scripts directory to the backup
echo "Moving unnecessary scripts to backup directory..."
find . -maxdepth 1 -name "*.sh" -type f | grep -v "organize_scripts.sh" | grep -v "cleanup_scripts.sh" | xargs -I{} mv {} old_scripts/

echo "Scripts have been moved to the old_scripts directory."
echo "You can review them there and delete the directory when you're confident you don't need them."
echo "To delete the backup directory, run: rm -rf old_scripts"
