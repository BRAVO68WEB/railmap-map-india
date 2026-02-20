import pool from "../db";
import { getStationByCode, type Station } from "./stations";
import { getRoute as getOsrmRoute } from "./osrm";
import { getRbsRoute, type RbsRoute } from "./rbs";

export interface RouteResult {
  geometry: {
    type: string;
    coordinates: number[][];
  };
  distance_km: number;
  duration_hours: number | null;
  from: Station;
  to: Station;
  intermediate_stations: Station[];
  rbs_route: RbsRoute | null;
  route_source: "osrm" | "rbs";
}

export async function findRoute(
  fromCode: string,
  toCode: string
): Promise<RouteResult> {
  const from = await getStationByCode(fromCode);
  if (!from) throw new Error(`Station not found: ${fromCode}`);

  const to = await getStationByCode(toCode);
  if (!to) throw new Error(`Station not found: ${toCode}`);

  // Fetch OSRM and RBS in parallel
  const [osrmResult, rbsResult] = await Promise.allSettled([
    getOsrmRoute(from.lon, from.lat, to.lon, to.lat),
    getRbsRoute(fromCode, toCode),
  ]);

  const osrmRoute =
    osrmResult.status === "fulfilled" ? osrmResult.value : null;
  const rbsRoute =
    rbsResult.status === "fulfilled" ? rbsResult.value : null;

  if (osrmRoute) {
    // OSRM succeeded: use OSRM geometry + PostGIS corridor stations
    const intermediateResult = await pool.query(
      `SELECT code, name, ST_Y(geom) as lat, ST_X(geom) as lon
       FROM stations
       WHERE geom IS NOT NULL
         AND code != $1 AND code != $2
         AND ST_DWithin(
           geom::geography,
           ST_GeomFromGeoJSON($3)::geography,
           2000
         )
       ORDER BY ST_LineLocatePoint(ST_GeomFromGeoJSON($3), geom)`,
      [
        fromCode.toUpperCase(),
        toCode.toUpperCase(),
        JSON.stringify(osrmRoute.geometry),
      ]
    );

    return {
      geometry: osrmRoute.geometry,
      distance_km: Math.round((osrmRoute.distance / 1000) * 10) / 10,
      duration_hours: Math.round((osrmRoute.duration / 3600) * 10) / 10,
      from,
      to,
      intermediate_stations: intermediateResult.rows,
      rbs_route: rbsRoute,
      route_source: "osrm",
    };
  }

  if (rbsRoute && rbsRoute.stations.length >= 2) {
    // OSRM failed, RBS fallback: build geometry from RBS station coordinates
    const coordinates = rbsRoute.stations.map((s) => [s.lon, s.lat]);
    const intermediateStations = rbsRoute.stations
      .slice(1, -1)
      .map((s) => ({
        code: s.code,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
      }));

    return {
      geometry: {
        type: "LineString",
        coordinates,
      },
      distance_km: rbsRoute.total_distance_km,
      duration_hours: null,
      from,
      to,
      intermediate_stations: intermediateStations,
      rbs_route: rbsRoute,
      route_source: "rbs",
    };
  }

  throw new Error("Could not find route: both OSRM and RBS failed");
}
