#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT=$(pwd)

# ── Colors ───────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

step() { echo -e "\n${BLUE}==> $1${NC}"; }
ok()   { echo -e "${GREEN}    ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}    ⚠ $1${NC}"; }
fail() { echo -e "${RED}    ✗ $1${NC}"; exit 1; }

# ── 1. Check prerequisites ──────────────────────────────────────────
step "Checking prerequisites..."

for cmd in docker osmium ogr2ogr bun unzip; do
  if command -v "$cmd" &>/dev/null; then
    ok "$cmd found: $(command -v "$cmd")"
  else
    fail "$cmd is not installed. Please install it first."
  fi
done

# ── 2. Verify data files ────────────────────────────────────────────
step "Verifying data files..."

PBF_FILE=$(ls "$ROOT"/*.osm.pbf 2>/dev/null | head -1 || true)
if [[ -z "$PBF_FILE" ]]; then
  fail "No .osm.pbf file found in project root. Download India PBF from https://download.geofabrik.de/"
fi
ok "PBF file: $(basename "$PBF_FILE")"

PBF_BASE=$(basename "$PBF_FILE" .osm.pbf)

LINES_ZIP=$(ls "$ROOT"/hotosm_ind_railways_lines_geojson.zip 2>/dev/null || true)
POINTS_ZIP=$(ls "$ROOT"/hotosm_ind_railways_points_geojson.zip 2>/dev/null || true)
if [[ -z "$LINES_ZIP" || -z "$POINTS_ZIP" ]]; then
  fail "Missing HOT OSM GeoJSON zips. Download from https://data.humdata.org/"
fi
ok "HOT OSM zips found"

if [[ ! -f "$ROOT/station.json" ]]; then
  fail "station.json not found in project root"
fi
ok "station.json found"

# ── 3. Install dependencies ─────────────────────────────────────────
step "Installing dependencies with bun..."
bun install
ok "Dependencies installed"

# ── 4. Start PostGIS ─────────────────────────────────────────────────
step "Starting PostGIS..."
docker compose -f docker-compose.dev.yml up -d postgis

echo "    Waiting for PostGIS to be healthy..."
RETRIES=30
until docker compose -f docker-compose.dev.yml exec -T postgis pg_isready -U postgres &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    fail "PostGIS did not become healthy in time"
  fi
  sleep 2
done
ok "PostGIS is ready"

# ── 5. Extract railway data ─────────────────────────────────────────
step "Extracting railway data from PBF..."
mkdir -p data

osmium tags-filter "$PBF_FILE" \
  w/railway=rail \
  n/railway=station n/railway=halt \
  -o data/india-railways.osm.pbf --overwrite

ok "Filtered railway PBF created"

osmium cat data/india-railways.osm.pbf -o data/india-railways.osm --overwrite
ok "Converted to OSM XML"

# ── 6. Build OSRM graph ─────────────────────────────────────────────
step "Building OSRM graph (this may take a while)..."

if [[ -f "$ROOT/${PBF_BASE}.osrm" ]]; then
  warn "OSRM files already exist for ${PBF_BASE}, skipping extraction"
else
  docker run --rm -v "$ROOT:/data" ghcr.io/project-osrm/osrm-backend \
    osrm-extract -p /data/profiles/train.lua "/data/$(basename "$PBF_FILE")"
  ok "OSRM extraction complete"

  docker run --rm -v "$ROOT:/data" ghcr.io/project-osrm/osrm-backend \
    osrm-contract "/data/${PBF_BASE}.osrm"
  ok "OSRM contraction complete"
fi

# ── 7. Start OSRM ───────────────────────────────────────────────────
step "Starting OSRM routing engine..."
docker compose -f docker-compose.dev.yml up -d osrm

echo "    Waiting for OSRM to be ready..."
RETRIES=30
until curl -sf http://localhost:5001/nearest/v1/train/77.2,28.6 &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    fail "OSRM did not become ready in time"
  fi
  sleep 2
done
ok "OSRM is ready"

# ── 8. Import GeoJSON into PostGIS ──────────────────────────────────
step "Importing GeoJSON into PostGIS..."

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-railway_map}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-postgres}"

PG_CONN="PG:host=${DB_HOST} port=${DB_PORT} dbname=${DB_NAME} user=${DB_USER} password=${DB_PASS}"

unzip -o "$LINES_ZIP" -d data/
unzip -o "$POINTS_ZIP" -d data/

LINES_FILE=$(find data/ -name '*lines*.geojson' -o -name '*lines*.json' | head -1)
POINTS_FILE=$(find data/ -name '*points*.geojson' -o -name '*points*.json' | head -1)

ogr2ogr -f "PostgreSQL" "$PG_CONN" "$LINES_FILE" -nln railway_lines -overwrite -lco GEOMETRY_NAME=geom
ok "Railway lines imported"

ogr2ogr -f "PostgreSQL" "$PG_CONN" "$POINTS_FILE" -nln railway_points -overwrite -lco GEOMETRY_NAME=geom
ok "Railway points imported"

# ── 9. Seed stations ────────────────────────────────────────────────
step "Seeding stations from station.json..."
bun run seed
ok "Stations seeded"

# ── 10. Run fuzzy matching ──────────────────────────────────────────
step "Running fuzzy station matching (this may take a minute)..."
PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
  -f scripts/match-stations.sql
ok "Fuzzy matching complete"

# ── Done ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Setup complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Next steps:"
echo "    bun run dev        → Start dev server (API :3001, client :5173)"
echo "    bun run build      → Build both apps for production"
echo "    docker compose up  → Run full stack with Docker (production)
    docker compose -f docker-compose.dev.yml up  → Run full stack (development)"
echo ""
