#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5433}"
DB_NAME="${DB_NAME:-railway_map}"
DB_USER="${DB_USER:-postgres}"
DB_PASS="${DB_PASS:-postgres}"

PG_CONN="PG:host=${DB_HOST} port=${DB_PORT} dbname=${DB_NAME} user=${DB_USER} password=${DB_PASS}"

echo "==> Unzipping HOT OSM GeoJSON files..."
unzip -o hotosm_ind_railways_lines_geojson.zip -d data/
unzip -o hotosm_ind_railways_points_geojson.zip -d data/

LINES_FILE=$(find data/ -name '*lines*.geojson' -o -name '*lines*.json' | head -1)
POINTS_FILE=$(find data/ -name '*points*.geojson' -o -name '*points*.json' | head -1)

echo "==> Lines file: $LINES_FILE"
echo "==> Points file: $POINTS_FILE"

echo "==> Importing railway lines into PostGIS..."
ogr2ogr -f "PostgreSQL" "$PG_CONN" \
  "$LINES_FILE" -nln railway_lines -overwrite -lco GEOMETRY_NAME=geom

echo "==> Importing railway points into PostGIS..."
ogr2ogr -f "PostgreSQL" "$PG_CONN" \
  "$POINTS_FILE" -nln railway_points -overwrite -lco GEOMETRY_NAME=geom

echo "==> Done importing GeoJSON data."
