#!/usr/bin/env bash
set -euo pipefail

DB_HOST="${DB_HOST:-postgis}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${POSTGRES_DB:-railway_map}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD:-postgres}"

export PGPASSWORD="$DB_PASS"
PSQL="psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME"
export DATABASE_URL="postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

# ── Idempotency check ──────────────────────────────────────────────
STATION_COUNT=$($PSQL -t -A -c "SELECT COUNT(*) FROM stations;" 2>/dev/null || echo "0")
if [ "$STATION_COUNT" -gt "0" ]; then
  echo "Database already seeded ($STATION_COUNT stations) — skipping."
  exit 0
fi

echo "==> Starting database initialization..."

# ── 1. Create extensions ───────────────────────────────────────────
echo "==> Creating extensions..."
$PSQL -c "CREATE EXTENSION IF NOT EXISTS postgis;"
$PSQL -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# ── 2. Discover and download HOT OSM data via HDX API ─────────────
echo "==> Fetching HDX dataset metadata..."
HDX_API="https://data.humdata.org/api/3/action/package_show?id=hotosm_ind_railways"
METADATA=$(curl -sf "$HDX_API")

LINES_URL=$(echo "$METADATA" | jq -r '.result.resources[] | select(.name | test("lines.*geojson"; "i")) | .download_url' | head -1)
POINTS_URL=$(echo "$METADATA" | jq -r '.result.resources[] | select(.name | test("points.*geojson"; "i")) | .download_url' | head -1)

if [ -z "$LINES_URL" ] || [ -z "$POINTS_URL" ]; then
  echo "ERROR: Could not find GeoJSON download URLs from HDX API"
  echo "Lines URL: $LINES_URL"
  echo "Points URL: $POINTS_URL"
  exit 1
fi

echo "  Lines:  $LINES_URL"
echo "  Points: $POINTS_URL"

WORK_DIR="/tmp/init-data"
mkdir -p "$WORK_DIR"

echo "==> Downloading railway lines..."
curl -L -o "$WORK_DIR/lines.zip" "$LINES_URL"
unzip -o "$WORK_DIR/lines.zip" -d "$WORK_DIR/lines"

echo "==> Downloading railway points..."
curl -L -o "$WORK_DIR/points.zip" "$POINTS_URL"
unzip -o "$WORK_DIR/points.zip" -d "$WORK_DIR/points"

# ── 3. Import GeoJSON into PostGIS ────────────────────────────────
LINES_GEOJSON=$(find "$WORK_DIR/lines" -name "*.geojson" | head -1)
POINTS_GEOJSON=$(find "$WORK_DIR/points" -name "*.geojson" | head -1)

echo "==> Importing railway lines into PostGIS..."
ogr2ogr -f "PostgreSQL" \
  "PG:host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASS" \
  "$LINES_GEOJSON" \
  -nln railway_lines \
  -overwrite \
  -lco GEOMETRY_NAME=geom

echo "==> Importing railway points into PostGIS..."
ogr2ogr -f "PostgreSQL" \
  "PG:host=$DB_HOST port=$DB_PORT dbname=$DB_NAME user=$DB_USER password=$DB_PASS" \
  "$POINTS_GEOJSON" \
  -nln railway_points \
  -overwrite \
  -lco GEOMETRY_NAME=geom

# ── 4. Seed stations ──────────────────────────────────────────────
echo "==> Seeding stations from station.json..."
cd /init && bun apps/server/src/seed-stations.ts

# ── 5. Run fuzzy matching ─────────────────────────────────────────
echo "==> Running fuzzy station matching..."
$PSQL -f /init/scripts/match-stations.sql

# ── Cleanup ────────────────────────────────────────────────────────
rm -rf "$WORK_DIR"

echo "==> Database initialization complete."
