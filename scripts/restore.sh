#!/bin/bash

# Database restore script
set -e

# Check if backup file is provided
if [ -z "$1" ]; then
    echo "❌ ERROR: Please provide backup file path"
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 ./backups/customer_success_backup_20231201_120000.sql"
    exit 1
fi

BACKUP_FILE="$1"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ ERROR: Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract database connection details from DATABASE_URL
DB_URL_REGEX="postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/([^?]+)"

if [[ $DATABASE_URL =~ $DB_URL_REGEX ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
else
    echo "❌ ERROR: Invalid DATABASE_URL format"
    exit 1
fi

echo "⚠️  WARNING: This will restore the database and overwrite existing data!"
echo "📅 Date: $(date)"
echo "🎯 Database: $DB_NAME"
echo "🏠 Host: $DB_HOST:$DB_PORT"
echo "📁 Backup file: $BACKUP_FILE"

# Confirm restore
read -p "Are you sure you want to continue? (yes/no): " -r
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
    echo "❌ Restore cancelled"
    exit 1
fi

# Set password for pg_restore
export PGPASSWORD="$DB_PASS"

echo "🗄️  Starting database restore..."

# Check if backup file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "🗜️  Decompressing backup file..."
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

# Restore database
pg_restore \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    "$BACKUP_FILE"

# Check if restore was successful
if [ $? -eq 0 ]; then
    echo "✅ Database restore completed successfully!"
    
    # Run migrations to ensure schema is up to date
    echo "🔧 Running migrations to ensure schema is current..."
    npx prisma migrate deploy
    
    echo "✅ Migrations completed!"
    
else
    echo "❌ Database restore failed!"
    exit 1
fi

# Clean up temporary file if created
if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
    rm "$TEMP_FILE"
fi

# Unset password
unset PGPASSWORD

echo "🎉 Restore process completed!"
echo "⚠️  Remember to restart your application to ensure all connections are refreshed"
