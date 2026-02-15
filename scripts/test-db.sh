#!/bin/bash
# Test database connection
echo "Testing DB connection..."
echo "Password var set: $([ -n "$PAGEPASS_DB_PASSWORD" ] && echo 'yes' || echo 'NO')"
echo "Password length: ${#PAGEPASS_DB_PASSWORD}"

# Try connection
psql "postgresql://postgres.kuwuymdqtkmljwqppvdz:${PAGEPASS_DB_PASSWORD}@aws-1-ca-central-1.pooler.supabase.com:6543/postgres" -c "SELECT 'connected' as status"
