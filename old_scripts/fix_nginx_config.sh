#!/bin/bash
# Script to fix Nginx configuration for MyCrypto deployment

echo "=== MyCrypto Nginx Configuration Fix ==="

# Create Nginx configuration file
echo "Creating Nginx configuration file..."
cat > nginx.conf << 'EOF'
server {
    listen 80;
    server_name crypto.viguri.org;

    # Redirect HTTP to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    server_name crypto.viguri.org;

    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/crypto.viguri.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crypto.viguri.org/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Referrer-Policy no-referrer-when-downgrade;

    # Root directory
    root /var/www/vhosts/viguri.org/crypto.viguri.org/client/public;
    index index.html;

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3003/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
EOF

echo "Nginx configuration created"

# Update allowed origins in the environment
echo "Updating allowed origins in docker-compose.yml..."
sed -i 's/ALLOWED_ORIGINS=https:\/\/crypto.viguri.org,http:\/\/localhost:3003,http:\/\/localhost:8080/ALLOWED_ORIGINS=https:\/\/crypto.viguri.org,http:\/\/localhost:3003,http:\/\/localhost:8080,http:\/\/server:3003/' docker-compose.yml

echo "Updating API routes to fix registration endpoint..."
# Check if the registration routes file exists
if [ -f "server/api/routes/registration/index.js" ]; then
    # Make a backup
    cp server/api/routes/registration/index.js server/api/routes/registration/index.js.bak
    
    # Check if the file contains wallets endpoint
    if ! grep -q "router.get('/wallets'" server/api/routes/registration/index.js; then
        echo "Adding wallets endpoint to registration routes..."
        cat > server/api/routes/registration/index.js << 'EOF'
import express from 'express';
import { asyncHandler } from '../../../middleware/async.js';
import { blockchain } from '../../../services/blockchain.js';

const registrationRoutes = () => {
    const router = express.Router();
    
    // Register a new wallet
    router.post('/wallet', asyncHandler(async (req, res) => {
        try {
            const { name, email } = req.body;
            
            if (!name || !email) {
                return res.status(400).json({ 
                    success: false, 
                    error: 'Name and email are required' 
                });
            }
            
            const wallet = await blockchain.createWallet(name, email);
            res.status(201).json({ success: true, data: wallet });
        } catch (error) {
            console.error('Error registering wallet:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to register wallet' 
            });
        }
    }));
    
    // Get all wallets
    router.get('/wallets', asyncHandler(async (req, res) => {
        try {
            const wallets = await blockchain.getWallets();
            res.json({ success: true, data: wallets });
        } catch (error) {
            console.error('Error retrieving wallets:', error);
            res.status(500).json({ 
                success: false, 
                error: 'Failed to retrieve wallets' 
            });
        }
    }));

    return router;
};

export default registrationRoutes;
EOF
        echo "Registration routes updated with wallets endpoint"
    else
        echo "Wallets endpoint already exists in registration routes"
    fi
else
    echo "Registration routes file not found"
fi

# Rebuild and restart the containers
echo "Rebuilding and restarting Docker containers..."
docker-compose down
docker-compose build server
docker-compose up -d

echo "Waiting for containers to start..."
sleep 15

# Check container status
echo "Checking container status..."
docker ps -a

echo "Fix completed. Please install the Nginx configuration file and restart Nginx:"
echo "sudo cp nginx.conf /etc/nginx/sites-available/crypto.viguri.org"
echo "sudo ln -sf /etc/nginx/sites-available/crypto.viguri.org /etc/nginx/sites-enabled/"
echo "sudo nginx -t"
echo "sudo systemctl restart nginx"
