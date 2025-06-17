#!/bin/bash

# Development deployment script for Customer Success Analytics
# This script handles database migrations and application deployment

set -e  # Exit on any error

echo "🚀 Starting Customer Success Analytics development deployment..."

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Error: docker-compose.yml not found. Please run this script from the project root."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found. Using default environment variables."
    echo "   For production, please create a .env file with secure values."
fi

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
timeout=60
counter=0
until docker-compose exec -T postgres pg_isready -U postgres; do
    sleep 2
    counter=$((counter + 2))
    if [ $counter -ge $timeout ]; then
        echo "❌ Database failed to start within $timeout seconds"
        docker-compose logs postgres
        exit 1
    fi
done

# Wait for backend to be healthy
echo "⏳ Waiting for backend to be ready..."
timeout=120
counter=0
until curl -f http://localhost:5000/api/health > /dev/null 2>&1; do
    sleep 5
    counter=$((counter + 5))
    if [ $counter -ge $timeout ]; then
        echo "❌ Backend failed to start within $timeout seconds"
        echo "📋 Backend logs:"
        docker-compose logs backend
        exit 1
    fi
    echo "   Waiting for backend... ($counter/$timeout seconds)"
done

# Check if database tables exist
echo "🔍 Checking database schema..."
table_count=$(docker-compose exec -T postgres psql -U postgres -d customer_success_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | tr -d ' ')

if [ "$table_count" -eq "0" ]; then
    echo "⚠️  No tables found. Database migrations may have failed."
    echo "📋 Backend logs (last 50 lines):"
    docker-compose logs --tail=50 backend
    exit 1
else
    echo "✅ Database schema ready ($table_count tables found)"
fi

# Optional: Seed database with sample data
read -p "🌱 Do you want to seed the database with sample data? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🌱 Seeding database..."
    docker-compose exec backend npm run seed
    echo "✅ Database seeded successfully"
fi

# Show service status
echo "📊 Service status:"
docker-compose ps

echo ""
echo "✅ Development deployment completed successfully!"
echo ""
echo "🌐 Application URLs:"
echo "   Frontend: http://localhost:3000"
echo "   Backend API: http://localhost:5000/api"
echo "   API Health: http://localhost:5000/api/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo ""
