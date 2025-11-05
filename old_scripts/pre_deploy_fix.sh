#!/bin/bash
# Pre-deployment fixes for MyCrypto application

echo "Applying pre-deployment fixes for MyCrypto application..."

# 1. Fix logging directory permissions in Dockerfile
echo "Fixing Dockerfile to ensure proper logging permissions..."
cat > Dockerfile.fixed << 'EOF'
FROM node:20-alpine as base

WORKDIR /app
COPY package*.json ./
RUN npm ci

# Create log directories with proper permissions
RUN mkdir -p logs/archive server/logs/archive && \
    chmod -R 777 logs server/logs

FROM base as production

WORKDIR /app
COPY . .
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3003

# Command to run the app
CMD ["node", "server/server.js"]
EOF

# 2. Update docker-compose.prod.yml to use the fixed Dockerfile
echo "Updating docker-compose.prod.yml to use the fixed Dockerfile..."
cat > docker-compose.prod.yml.fixed << 'EOF'
version: "3.8"

services:
  server:
    build:
      context: .
      dockerfile: Dockerfile.fixed
      target: production
    ports:
      - "3003:3003"
    volumes:
      - ./logs:/app/logs
      - ./wallets.json:/app/wallets.json
    environment:
      - NODE_ENV=production
      - PORT=3003
      - LOG_LEVEL=info
      - BLOCKCHAIN_DIFFICULTY=4
      - ALLOWED_ORIGINS=https://crypto.viguri.org
    restart: always
    command: node server/server.js
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/test"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s

  cli:
    build:
      context: .
      dockerfile: Dockerfile.cli
    volumes:
      - ./wallets.json:/app/wallets.json
    environment:
      - API_URL=http://server:3003/api
      - NODE_ENV=production
    depends_on:
      server:
        condition: service_healthy
EOF

# 3. Apply the fixes
echo "Applying the fixes..."
mv Dockerfile.fixed Dockerfile
mv docker-compose.prod.yml.fixed docker-compose.prod.yml

echo "Pre-deployment fixes applied successfully!"
echo "You can now proceed with deployment to crypto.viguri.org"
