#!/bin/bash

# Load environment variables
set -a
source .env.local
set +a

# Extract host from NEXT_PUBLIC_SUPABASE_URL
HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|http://||')
PGHOST="db.${HOST}"
PGUSER="postgres"
PGPASSWORD="${SUPABASE_SERVICE_ROLE_KEY}"
PGDATABASE="postgres"

export PGHOST PGUSER PGPASSWORD PGDATABASE

echo "🔍 Checking database schema..."
echo ""

# Check if gift_on_borrow column exists (migration 011)
echo "Checking for gift_on_borrow column..."
psql -t -c "SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='books' AND column_name='gift_on_borrow'
);"

# Check if off_shelf_at column exists (migration 010)
echo "Checking for off_shelf_at column..."
psql -t -c "SELECT EXISTS (
  SELECT 1 FROM information_schema.columns 
  WHERE table_name='books' AND column_name='off_shelf_at'
);"

# Check if book_ownership_history table exists (migration 011)
echo "Checking for book_ownership_history table..."
psql -t -c "SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name='book_ownership_history'
);"

# Check book statuses
echo ""
echo "Current book statuses in database:"
psql -t -c "SELECT DISTINCT status FROM books ORDER BY status;"

echo ""
echo "✅ Migration check complete"
