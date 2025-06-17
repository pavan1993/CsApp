#!/bin/bash

# Database migration script for production
set -e

echo "🚀 Starting database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Check if we can connect to the database
echo "🔍 Testing database connection..."
npx prisma db execute --stdin <<< "SELECT 1;" > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo "❌ ERROR: Cannot connect to database"
    exit 1
fi

echo "✅ Database connection successful"

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run migrations
echo "📦 Running database migrations..."
npx prisma migrate deploy

# Check migration status
echo "📋 Checking migration status..."
npx prisma migrate status

# Seed database if needed (optional)
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed:prod
fi

echo "✅ Database migration completed successfully!"
