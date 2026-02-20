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

# ── 1. Verify OSRM data exists ───────────────────────────────────────
step "Checking for OSRM data files..."
if ls "$ROOT"/*.osrm &>/dev/null; then
  ok "OSRM data files found"
else
  fail "No .osrm files found in project root. Run 'bun run init' on a dev machine first."
fi

# ── 2. Start services ────────────────────────────────────────────────
step "Starting services..."
docker compose up -d
ok "All containers started"

# ── 3. Wait for PostGIS ──────────────────────────────────────────────
step "Waiting for PostGIS to be healthy..."
RETRIES=30
until docker compose exec -T postgis pg_isready -U postgres &>/dev/null; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    fail "PostGIS did not become healthy in time"
  fi
  sleep 2
done
ok "PostGIS is ready"

# ── 4. Wait for OSRM ─────────────────────────────────────────────────
step "Waiting for OSRM to be ready..."
RETRIES=30
until docker compose exec -T osrm curl -sf http://localhost:5000/nearest/v1/train/77.2,28.6 &>/dev/null 2>&1 || \
      curl -sf http://localhost:5000/nearest/v1/train/77.2,28.6 &>/dev/null 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [[ $RETRIES -le 0 ]]; then
    fail "OSRM did not become ready in time"
  fi
  sleep 2
done
ok "OSRM is ready"

# ── 5. Database migrations ───────────────────────────────────────────
DB_NAME="${POSTGRES_DB:-railway_map}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASS="${POSTGRES_PASSWORD:-postgres}"

step "Running database migrations..."

# Create extensions and tables
docker compose exec -T postgis psql -U "$DB_USER" -d "$DB_NAME" <<'SQL'
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  geom GEOMETRY(Point, 4326),
  matched_osm_name VARCHAR(255),
  match_confidence FLOAT
);
SQL
ok "Extensions and tables created"

# ── 6. Seed stations ─────────────────────────────────────────────────
step "Seeding stations from station.json..."
docker compose exec -T server bun /app/apps/server/src/seed-stations.ts 2>/dev/null || \
  warn "Seed script not available or stations already seeded — skipping"

# ── 7. Run fuzzy matching ────────────────────────────────────────────
step "Running fuzzy station matching..."
if [[ -f "$ROOT/scripts/match-stations.sql" ]]; then
  docker compose exec -T postgis psql -U "$DB_USER" -d "$DB_NAME" < "$ROOT/scripts/match-stations.sql"
  ok "Fuzzy matching complete"
else
  warn "match-stations.sql not found — skipping fuzzy matching"
fi

# ── Done ─────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  🚂 Railway Map is up and running!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "  Services:"
echo "    🌐 Client:     http://localhost:${PORT:-80}"
echo "    🔌 API Server: http://localhost:3001"
echo ""
