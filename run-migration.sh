#!/bin/bash
# Helper script to run migrations via Supabase CLI
# Usage: ./run-migration.sh migrations/001-example.sql

if [ -z "$1" ]; then
  echo "Usage: ./run-migration.sh <migration-file>"
  exit 1
fi

MIGRATION_FILE="$1"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: File not found: $MIGRATION_FILE"
  exit 1
fi

# Load env vars
if [ -f .env.local ]; then
  export $(cat .env.local | grep -v '^#' | xargs)
fi

# Extract host from Supabase URL
SUPABASE_HOST=$(echo $NEXT_PUBLIC_SUPABASE_URL | sed 's|https://||' | sed 's|http://||')
SUPABASE_PROJECT_REF=$(echo $SUPABASE_HOST | cut -d'.' -f1)

echo "================================"
echo "Migration: $MIGRATION_FILE"
echo "Project: $SUPABASE_PROJECT_REF"
echo "================================"
echo ""
cat "$MIGRATION_FILE"
echo ""
echo "================================"
echo "Execute this migration? (Ctrl+C to cancel)"
read -p "Type 'yes' to confirm: " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
  echo "Cancelled."
  exit 0
fi

# Execute via Supabase CLI
npx supabase db query -f "$MIGRATION_FILE" --project-ref "$SUPABASE_PROJECT_REF"
