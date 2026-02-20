#!/usr/bin/env bash
set -euo pipefail

PBF_URL="https://download.geofabrik.de/asia/india-latest.osm.pbf"
PBF_FILE="/data/india-latest.osm.pbf"
OSRM_FILE="/data/india-latest.osrm"
HSGR_FILE="/data/india-latest.osrm.hsgr"

# Idempotency: skip if OSRM graph already built
if [ -f "$HSGR_FILE" ]; then
  echo "OSRM graph already exists at $HSGR_FILE — skipping."
  exit 0
fi

# Download PBF if not already present
if [ ! -f "$PBF_FILE" ]; then
  echo "Downloading India PBF from Geofabrik..."
  curl -L -o "${PBF_FILE}.tmp" "$PBF_URL"
  mv "${PBF_FILE}.tmp" "$PBF_FILE"
  echo "Download complete."
else
  echo "PBF file already exists — skipping download."
fi

# Extract
echo "Running osrm-extract..."
osrm-extract -p /profiles/train.lua "$PBF_FILE"

# Contract
echo "Running osrm-contract..."
osrm-contract "$OSRM_FILE"

echo "OSRM graph build complete."
