FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl

# Copy package files
COPY package.json yarn.lock ./

# Install dependencies
RUN yarn install

# Copy application files
COPY . .

# Create necessary directories
RUN mkdir -p logs src/storage/blockchain

# Expose ports for API and client
EXPOSE 3000 8080

# Set default command
CMD ["yarn", "dev:all"]