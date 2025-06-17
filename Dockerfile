# Multi-stage build for Node.js backend - use debian-based image for better Prisma compatibility
FROM node:18-slim AS base

# Install dependencies only when needed
FROM base AS deps
RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies (including dev dependencies for development)
RUN npm ci --include=dev && npm cache clean --force

# Generate Prisma client with explicit platform
RUN npx prisma generate --generator client

# Build stage
FROM base AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copy package files and prisma schema
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install all dependencies (including dev dependencies)
RUN npm ci --include=dev

# Copy source code from backend directory
COPY backend/ .
COPY --from=deps /app/node_modules ./node_modules

# Regenerate Prisma client in the build environment
RUN npx prisma generate

# Build the application (if build script exists, otherwise skip)
RUN npm run build || echo "No build script found, using source files directly"

# Production stage
FROM base AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y curl openssl && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy application files
COPY --from=builder --chown=nodejs:nodejs /app ./
COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules

# Create uploads directory
RUN mkdir -p uploads && chown nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["sh", "-c", "echo 'Debug: Starting container...' && pwd && ls -la && npm run dev"]
