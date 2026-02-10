#!/bin/bash
set -e

echo "=== Deploying Migrations 015-016 ==="

source .env.local

echo "Running migration 015: Backfill book_circle_visibility..."
psql "$DATABASE_URL" -f migrations/015-backfill-book-visibility.sql

echo "Running migration 016: Auto-create visibility entries..."
psql "$DATABASE_URL" -f migrations/016-auto-create-visibility-entries.sql

echo "✅ Migrations deployed successfully!"
