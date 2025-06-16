# Multi-stage build for React frontend with Nginx
FROM node:18-alpine AS base

# Build stage
FROM base AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:prod

# Production stage with Nginx
FROM nginx:alpine AS runner

# Install curl for health checks
RUN apk add --no-cache curl

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nginx -u 1001

# Set proper permissions
RUN chown -R nginx:nodejs /usr/share/nginx/html
RUN chown -R nginx:nodejs /var/cache/nginx
RUN chown -R nginx:nodejs /var/log/nginx
RUN chown -R nginx:nodejs /etc/nginx/conf.d
RUN touch /var/run/nginx.pid
RUN chown -R nginx:nodejs /var/run/nginx.pid

# Switch to non-root user
USER nginx

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
