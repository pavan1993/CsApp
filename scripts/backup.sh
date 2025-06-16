#!/bin/bash

# Database backup script
set -e

# Configuration
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="customer_success_backup_${DATE}.sql"

# Parse DATABASE_URL to extract connection details
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL environment variable is not set"
    exit 1
fi

# Extract database connection details from DATABASE_URL
# Format: postgresql://username:password@host:port/database
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

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🗄️  Starting database backup..."
echo "📅 Date: $(date)"
echo "🎯 Database: $DB_NAME"
echo "🏠 Host: $DB_HOST:$DB_PORT"
echo "📁 Backup file: $BACKUP_FILE"

# Set password for pg_dump
export PGPASSWORD="$DB_PASS"

# Create backup
pg_dump \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --format=custom \
    --file="$BACKUP_DIR/$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "📁 Backup saved to: $BACKUP_DIR/$BACKUP_FILE"
    
    # Get backup file size
    BACKUP_SIZE=$(du -h "$BACKUP_DIR/$BACKUP_FILE" | cut -f1)
    echo "📊 Backup size: $BACKUP_SIZE"
    
    # Compress backup (optional)
    if [ "$COMPRESS_BACKUP" = "true" ]; then
        echo "🗜️  Compressing backup..."
        gzip "$BACKUP_DIR/$BACKUP_FILE"
        echo "✅ Backup compressed: $BACKUP_DIR/$BACKUP_FILE.gz"
    fi
    
    # Clean up old backups (keep last 7 days)
    echo "🧹 Cleaning up old backups..."
    find "$BACKUP_DIR" -name "customer_success_backup_*.sql*" -mtime +7 -delete
    echo "✅ Old backups cleaned up"
    
else
    echo "❌ Backup failed!"
    exit 1
fi

# Unset password
unset PGPASSWORD

echo "🎉 Backup process completed!"
