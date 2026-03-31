#!/usr/bin/env bash
# Seed the production database from scripts/seed.sql.
# Safe to run multiple times — exits immediately if data already exists.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SEED_FILE="$SCRIPT_DIR/seed.sql"

if [ -z "$DATABASE_URL" ]; then
  echo "❌  DATABASE_URL is not set — cannot seed." >&2
  exit 1
fi

# Check if airlines table already has rows
COUNT=$(psql "$DATABASE_URL" -t -c "SELECT COUNT(*) FROM airlines;" 2>/dev/null | tr -d ' \n')

if [ "$COUNT" -gt 0 ] 2>/dev/null; then
  echo "✅  Database already has $COUNT airlines — skipping seed."
  exit 0
fi

echo "🌱  Database is empty — seeding from $SEED_FILE ..."

# Strip Replit-specific psql meta-commands (\restrict / \unrestrict) then run
grep -Ev '^\s*\\(restrict|unrestrict)' "$SEED_FILE" | psql "$DATABASE_URL" -v ON_ERROR_STOP=1

echo ""
echo "✅  Seed complete. Counts:"
psql "$DATABASE_URL" -c "
  SELECT
    (SELECT COUNT(*) FROM airlines)           AS airlines,
    (SELECT COUNT(*) FROM airports)           AS airports,
    (SELECT COUNT(*) FROM airline_operations) AS airline_operations,
    (SELECT COUNT(*) FROM ground_handlers)    AS ground_handlers;
"
