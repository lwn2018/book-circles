#!/bin/bash

# Load environment variables
source .env.local

# Extract connection string from DATABASE_URL or use NEXT_PUBLIC_SUPABASE_URL
if [ -n "$DATABASE_URL" ]; then
  CONN_STRING="$DATABASE_URL"
else
  # Construct from Supabase project
  SUPABASE_PROJECT_REF=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed -E 's|https://([^.]+)\.supabase\.co|\1|')
  # Note: This requires SUPABASE_DB_PASSWORD to be set
  CONN_STRING="postgresql://postgres.${SUPABASE_PROJECT_REF}:${SUPABASE_DB_PASSWORD}@aws-0-us-west-1.pooler.supabase.com:6543/postgres"
fi

echo "Running migration 015-add-beta-feedback.sql..."
psql "$CONN_STRING" -f migrations/015-add-beta-feedback.sql

if [ $? -eq 0 ]; then
  echo "✅ Migration 015 completed successfully"
else
  echo "❌ Migration 015 failed"
  exit 1
fi
