#!/bin/bash
# Script to create the missing logs API route file in the correct location

echo "=== Creating Logs API Route Fix ==="

# Create the logs API route directory and file
echo "Creating logs API route file..."
mkdir -p server/api/routes/logs

cat > server/api/routes/logs/index.js << 'EOF'
import express from 'express';
import { asyncHandler } from '../../../middleware/async.js';
import { logger } from '../../../utils/logger/index.js';

const logsRoutes = () => {
    const router = express.Router();
    
    // Get all logs
    router.get('/', asyncHandler(async (req, res) => {
        try {
            const logs = await logger.getLogs();
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error('Error retrieving logs:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs' });
        }
    }));

    // Get logs by level
    router.get('/level/:level', asyncHandler(async (req, res) => {
        try {
            const { level } = req.params;
            const logs = await logger.getLogsByLevel(level);
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error(`Error retrieving logs by level ${req.params.level}:`, error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs by level' });
        }
    }));

    // Get logs by component
    router.get('/component/:component', asyncHandler(async (req, res) => {
        try {
            const { component } = req.params;
            const logs = await logger.getLogsByComponent(component);
            res.json({ success: true, data: logs });
        } catch (error) {
            console.error(`Error retrieving logs by component ${req.params.component}:`, error);
            res.status(500).json({ success: false, error: 'Failed to retrieve logs by component' });
        }
    }));

    return router;
};

export default logsRoutes;
EOF

echo "Logs API route file created"

# Check if the logs route is imported in the main routes file
if [ -f "server/api/routes/index.js" ]; then
    # Check if logs route is already imported
    if ! grep -q "import logsRoutes from './logs/index.js';" server/api/routes/index.js; then
        echo "Updating main routes file to include logs routes..."
        cp server/api/routes/index.js server/api/routes/index.js.bak
        
        # Add the import
        sed -i '/import/a import logsRoutes from '\''./logs/index.js'\'';\n' server/api/routes/index.js
        
        # Add the route
        sed -i '/router.use/a router.use('\''\/logs'\'', logsRoutes());\n' server/api/routes/index.js
        
        echo "Main routes file updated"
    else
        echo "Logs routes already imported in main routes file"
    fi
else
    echo "Main routes file not found"
fi

echo "=== Fix completed ==="
echo "Now you need to deploy this fix to your server."
echo "Run: ./deploy_to_viguri.sh"
echo "After deployment, restart the Docker containers on your server:"
echo "ssh viguri@81.169.168.33 \"cd /var/www/vhosts/viguri.org/crypto.viguri.org && docker-compose down && docker-compose up -d --build\""
