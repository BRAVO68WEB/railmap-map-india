export interface Station {
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export interface RbsStation {
  code: string;
  name: string;
  lat: number;
  lon: number;
  distance_km: number;
  gauge: string;
}

export interface RbsRoute {
  stations: RbsStation[];
  total_distance_km: number;
  from_code: string;
  to_code: string;
}

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

export interface Train {
  number: string;
  name: string;
  from: { code: string; departure: string };
  to: { code: string; arrival: string };
  duration: string;
  distance_km: number | null;
  run_days: string[];
  classes: string[];
  source: "railyatri" | "erail";
}
