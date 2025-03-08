# Base stage for common setup
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl python3 make g++
COPY package.json yarn.lock ./

# Development stage
FROM base AS development
RUN yarn install
COPY . .
ARG SKIP_TESTS=false
RUN if [ "$SKIP_TESTS" = "false" ] ; then yarn test; fi
ENV NODE_ENV=development
CMD ["yarn", "dev"]

# Production stage
FROM base AS production
RUN yarn install --production
COPY . .

# Create necessary directories
RUN mkdir -p logs src/storage/blockchain

# Create necessary directories with proper permissions
RUN mkdir -p logs src/storage/blockchain && \
    chown -R node:node /app

# Set environment variables
ENV PORT=3000

# Switch to non-root user
USER node

# Expose API port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD curl -f http://localhost:3000/test || exit 1