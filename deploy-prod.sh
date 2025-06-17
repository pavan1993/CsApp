#!/bin/bash

# Production deployment script for Customer Success Analytics
# This script handles production deployment with proper database setup

set -e  # Exit on any error

echo "🚀 Starting Customer Success Analytics PRODUCTION deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.prod.yml" ]; then
    echo "❌ Error: docker-compose.prod.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ Error: .env file not found. Production deployment requires environment configuration."
    echo "   Please create a .env file with production values."
    echo "   See .env.example for required variables."
    exit 1
fi

# Validate critical environment variables
echo "🔍 Validating environment configuration..."
source .env

required_vars=("POSTGRES_PASSWORD" "JWT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Error: Missing required environment variables: ${missing_vars[*]}"
    echo "   Please set these in your .env file before deploying to production."
    exit 1
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Stop existing services
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down

# Build production images
echo "🔨 Building production images..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Start services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0
until docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U ${POSTGRES_USER:-postgres}; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        echo "❌ Database failed to start within $timeout seconds"
        docker-compose -f docker-compose.prod.yml logs postgres
        exit 1
    fi
done

echo "✅ Database is ready"

# Wait for backend to complete migrations and be healthy
echo "⏳ Waiting for backend migrations and startup..."
timeout=180
counter=0
until curl -f http://localhost:5000/api/health > /dev/null 2>&1; do
    sleep 5
    counter=$((counter + 5))
    if [ $counter -ge $timeout ]; then
        echo "❌ Backend failed to start within $timeout seconds"
        echo "📋 Backend logs:"
        docker-compose -f docker-compose.prod.yml logs backend
        exit 1
    fi
    
    # Show progress every 15 seconds
    if [ $((counter % 15)) -eq 0 ]; then
        echo "   Waiting for backend startup and migrations... ($counter/$timeout seconds)"
        echo "   Recent backend logs:"
        docker-compose -f docker-compose.prod.yml logs --tail=5 backend
    fi
done

echo "✅ Backend is ready"

# Verify database schema
echo "🔍 Verifying database schema..."
table_count=$(docker-compose -f docker-compose.prod.yml exec -T postgres psql -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-customer_success_db} -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$table_count" -eq "0" ]; then
    echo "❌ No tables found in database. Migrations may have failed."
    echo "📋 Backend logs (last 50 lines):"
    docker-compose -f docker-compose.prod.yml logs --tail=50 backend
    exit 1
else
    echo "✅ Database schema verified ($table_count tables found)"
fi

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
timeout=60
counter=0
until curl -f http://localhost:80/health > /dev/null 2>&1 || curl -f http://localhost:80 > /dev/null 2>&1; do
    sleep 3
    counter=$((counter + 3))
    if [ $counter -ge $timeout ]; then
        echo "⚠️  Frontend health check failed, but continuing..."
        break
    fi
done

if [ $counter -lt $timeout ]; then
    echo "✅ Frontend is ready"
fi

# Show service status
echo "📊 Production service status:"
docker-compose -f docker-compose.prod.yml ps

# Show resource usage
echo "📈 Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "✅ PRODUCTION deployment completed successfully!"
echo ""
echo "🌐 Production URLs:"
echo "   Frontend: http://localhost (port 80)"
echo "   Backend API: http://localhost:5000/api"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "📋 Production management commands:"
echo "   View logs: docker-compose -f docker-compose.prod.yml logs -f"
echo "   Stop services: docker-compose -f docker-compose.prod.yml down"
echo "   Restart services: docker-compose -f docker-compose.prod.yml restart"
echo "   View resource usage: docker stats"
echo ""
echo "🔒 Security reminders:"
echo "   - Ensure firewall is configured properly"
echo "   - Monitor logs regularly"
echo "   - Keep environment variables secure"
echo "   - Set up SSL/HTTPS for production use"
echo ""
