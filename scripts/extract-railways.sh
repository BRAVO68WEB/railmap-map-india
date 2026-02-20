#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Filtering railway data from India PBF..."
osmium tags-filter india-260219.osm.pbf \
  w/railway=rail \
  n/railway=station n/railway=halt \
  -o data/india-railways.osm.pbf --overwrite

echo "==> Converting to OSM XML..."
osmium cat data/india-railways.osm.pbf -o data/india-railways.osm --overwrite

echo "==> Done. Output files in data/"
ls -lh data/india-railways.*
