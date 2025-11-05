FROM node:20-alpine as base

WORKDIR /app
RUN mkdir -p /app/logs && chmod -R 777 /app/logs
COPY package*.json ./
RUN npm ci

# Create log directories with proper permissions
RUN mkdir -p logs/archive server/logs/archive && \
    chmod -R 777 logs server/logs

FROM base as production

WORKDIR /app
RUN mkdir -p /app/logs && chmod -R 777 /app/logs
COPY . .
RUN npm prune --production

# Expose the port the app runs on
EXPOSE 3003

# Command to run the app
CMD ["node", "server/server.js"]
