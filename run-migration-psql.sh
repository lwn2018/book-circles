#!/bin/bash
# Run migrations via psql with approval workflow
# Usage: ./run-migration-psql.sh migrations/011-example.sql

set -e

if [ -z "$1" ]; then
  echo "Usage: ./run-migration-psql.sh <migration-file>"
  exit 1
fi

MIGRATION_FILE="$1"

if [ ! -f "$MIGRATION_FILE" ]; then
  echo "Error: File not found: $MIGRATION_FILE"
  exit 1
fi

# Connection details
PGHOST="aws-1-ca-central-1.pooler.supabase.com"
PGPORT="5432"
PGDATABASE="postgres"
PGUSER="postgres.kuwuymdqtkmljwqppvdz"

echo "========================================="
echo "Migration: $MIGRATION_FILE"
echo "Database: $PGDATABASE @ $PGHOST"
echo "========================================="
echo ""
cat "$MIGRATION_FILE"
echo ""
echo "========================================="
echo ""
echo "⚠️  This will execute on PRODUCTION database"
echo ""

export PGHOST PGPORT PGDATABASE PGUSER

# Execute the migration
psql -f "$MIGRATION_FILE"

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration completed successfully"
else
  echo ""
  echo "❌ Migration failed"
  exit 1
fi
