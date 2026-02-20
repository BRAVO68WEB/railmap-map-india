-- Enable trigram extension for fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create stations table if not exists
CREATE TABLE IF NOT EXISTS stations (
  id SERIAL PRIMARY KEY,
  code VARCHAR(10) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  geom GEOMETRY(Point, 4326),
  matched_osm_name VARCHAR(255),
  match_confidence FLOAT
);

-- Create GIN index on railway_points for fast % operator lookups
CREATE INDEX IF NOT EXISTS idx_railway_points_name_trgm
  ON railway_points USING GIN (UPPER(name) gin_trgm_ops);

-- Set similarity threshold for the % operator
SET pg_trgm.similarity_threshold = 0.4;

-- Fuzzy match station names to HOT OSM railway points
-- Uses the % operator with GIN index for fast trigram matching
UPDATE stations s
SET geom = sub.geom,
    matched_osm_name = sub.osm_name,
    match_confidence = sub.confidence
FROM (
  SELECT DISTINCT ON (s2.id)
    s2.id,
    rp.geom,
    rp.name AS osm_name,
    similarity(UPPER(s2.name), UPPER(rp.name)) AS confidence
  FROM stations s2
  JOIN railway_points rp
    ON rp.name IS NOT NULL
    AND UPPER(rp.name) % UPPER(s2.name)
  WHERE s2.geom IS NULL
  ORDER BY s2.id, similarity(UPPER(s2.name), UPPER(rp.name)) DESC
) sub
WHERE s.id = sub.id;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stations_geom ON stations USING GIST (geom);
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations (code);
CREATE INDEX IF NOT EXISTS idx_stations_name_trgm ON stations USING GIN (name gin_trgm_ops);

-- Report results
SELECT
  COUNT(*) AS total_stations,
  COUNT(geom) AS matched_stations,
  COUNT(*) - COUNT(geom) AS unmatched_stations,
  ROUND(AVG(match_confidence)::numeric, 3) AS avg_confidence
FROM stations;
