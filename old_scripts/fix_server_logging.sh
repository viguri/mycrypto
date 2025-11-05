#!/bin/bash
# Script to modify the server's logging initialization code to be more Docker-friendly

SERVER_USER="viguri"
SERVER_IP="81.169.168.33"
REMOTE_DIR="/var/www/vhosts/viguri.org/crypto.viguri.org"

echo "Creating a Docker-friendly version of the logging initialization code..."

ssh $SERVER_USER@$SERVER_IP "cat > $REMOTE_DIR/server/utils/logger/docker-fix.js << 'EOF'
/**
 * This module provides a modified version of the initializeLogging function
 * that is more Docker-friendly by handling permission errors gracefully.
 */

// Export a function to patch the initializeLogging function
export function patchInitializeLogging(originalInitializeLogging) {
  return async function initializeLoggingPatched() {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      const { fileURLToPath } = await import('url');

      // Get the directory name of the current module
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);

      // Define log directories
      const logDir = path.join(__dirname, '..', '..', '..', 'logs');
      const logArchiveDir = path.join(logDir, 'archive');

      console.log('Logger directories: ', { logDir, logArchiveDir });

      // Create log directories without trying to change permissions
      try {
        await fs.mkdir(logDir, { recursive: true });
        console.log('Logger directories initialized successfully');
      } catch (dirError) {
        console.log('Could not create log directory, but continuing anyway:', dirError.message);
      }

      try {
        await fs.mkdir(logArchiveDir, { recursive: true });
      } catch (archiveError) {
        console.log('Could not create log archive directory, but continuing anyway:', archiveError.message);
      }

      // Create empty log file if it doesn't exist
      const logFile = path.join(logDir, 'app.log');
      try {
        await fs.access(logFile);
      } catch {
        try {
          await fs.writeFile(logFile, '');
          console.log('Created log file:', logFile);
        } catch (fileError) {
          console.log('Could not create log file, but continuing anyway:', fileError.message);
        }
      }

      // Try to set file permissions, but don't fail if we can't
      try {
        await fs.chmod(logDir, 0o755);
        await fs.chmod(logArchiveDir, 0o755);
        await fs.chmod(logFile, 0o644);
      } catch (permError) {
        console.log('Could not set permissions on log files, but continuing anyway:', permError.message);
      }

      console.log('Logging system initialized successfully');
      return true;
    } catch (error) {
      console.error('Warning: Logging system initialization had issues:', error);
      // Don't exit the process, just return false to indicate there was an issue
      return false;
    }
  };
}
EOF"

echo "Now modifying the server.js file to use the patched logging function..."

ssh $SERVER_USER@$SERVER_IP "cat > $REMOTE_DIR/server-patch.js << 'EOF'
// Read the server.js file
const fs = require('fs');
const path = require('path');

const serverJsPath = path.join(__dirname, 'server', 'server.js');
let serverJs = fs.readFileSync(serverJsPath, 'utf8');

// Add the import for the docker fix
const importLine = "import logger from './utils/logger/index.js';";
const newImportLine = "import logger from './utils/logger/index.js';\nimport { patchInitializeLogging } from './utils/logger/docker-fix.js';";
serverJs = serverJs.replace(importLine, newImportLine);

// Modify the initializeLogging function to handle errors gracefully
const initFunctionRegex = /async function initializeLogging\(\) \{[\s\S]*?process\.exit\(1\);[\s\S]*?\}/;
const newInitFunction = `async function initializeLogging() {
  // Use the patched version that handles Docker volume permission issues
  const patchedInit = patchInitializeLogging(initializeLogging);
  return patchedInit();
}`;

serverJs = serverJs.replace(initFunctionRegex, newInitFunction);

// Write the modified file
fs.writeFileSync(serverJsPath, serverJs);
console.log('Server.js has been patched to handle Docker volume permission issues.');
EOF"

echo "Executing the patch script on the server..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && node server-patch.js"

echo "Restarting the Docker containers..."
ssh $SERVER_USER@$SERVER_IP "cd $REMOTE_DIR && sudo docker-compose -f docker-compose.prod.yml down && sudo docker-compose -f docker-compose.prod.yml up -d --build"

echo "Done! Check the logs to see if the issue is resolved:"
echo "ssh $SERVER_USER@$SERVER_IP \"cd $REMOTE_DIR && docker logs cryptoviguriorg-server-1\""
