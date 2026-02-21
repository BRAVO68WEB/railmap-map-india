import pool from "../db";

export interface Station {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export async function searchStations(query: string): Promise<Station[]> {
  const result = await pool.query(
    `SELECT code, name, ST_Y(geom) as lat, ST_X(geom) as lon
     FROM stations
     WHERE geom IS NOT NULL
       AND (code ILIKE $1 || '%' OR name ILIKE '%' || $1 || '%')
     ORDER BY
       CASE WHEN code ILIKE $1 || '%' THEN 0 ELSE 1 END,
       similarity(name, $1) DESC
     LIMIT 10`,
    [query]
  );
  return result.rows;
}

export async function getStationByCode(
  code: string
): Promise<Station | null> {
  const result = await pool.query(
    `SELECT code, name, ST_Y(geom) as lat, ST_X(geom) as lon
     FROM stations
     WHERE code = UPPER($1) AND geom IS NOT NULL
     LIMIT 1`,
    [code]
  );
  return result.rows[0] || null;
}

export async function getStationsByCodes(
  codes: string[]
): Promise<Map<string, Station>> {
  if (codes.length === 0) return new Map();

  const result = await pool.query(
    `SELECT code, name, ST_Y(geom) as lat, ST_X(geom) as lon
     FROM stations
     WHERE code = ANY($1) AND geom IS NOT NULL`,
    [codes.map((c) => c.toUpperCase())]
  );

  const map = new Map<string, Station>();
  for (const row of result.rows) {
    map.set(row.code, row);
  }
  return map;
}
