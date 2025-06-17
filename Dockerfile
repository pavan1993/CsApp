# Use Ubuntu-based Node.js image for compatibility with Ubuntu deployment
FROM node:18-slim AS base

# Install dependencies only when needed
FROM base AS deps
# Install necessary packages for Prisma and build tools
RUN apt-get update && apt-get install -y \
    openssl \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Copy package files from backend directory
COPY backend/package*.json ./
COPY backend/prisma ./prisma/

# Install dependencies
RUN npm ci --include=dev && npm cache clean --force

# Generate Prisma client for Debian/Ubuntu (glibc)
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x
RUN npx prisma generate

# Build stage
FROM base AS builder
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files and dependencies
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
COPY --from=deps /app/node_modules ./node_modules

# Copy source code from backend directory
COPY backend/ .

# Set Prisma binary target for Debian/Ubuntu
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# Generate Prisma client again in build stage
RUN npx prisma generate

# Build the application
RUN npm run build || echo "No build script found, using source files directly"

# Production stage
FROM base AS runner
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Set environment variables
ENV NODE_ENV=production
ENV PRISMA_CLI_BINARY_TARGETS=debian-openssl-3.0.x

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app ./

# Create uploads directory
RUN mkdir -p uploads && chown nodejs:nodejs uploads

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "run", "start"]
