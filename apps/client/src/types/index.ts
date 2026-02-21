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

export interface TrainSuggestion {
  number: string;
  displayText: string;
}

export interface TrainRouteStop {
  seq: number;
  code: string;
  name: string;
  arrival: string;
  departure: string;
  halt_mins: string;
  distance_km: number;
  day: number;
  platform: string;
  zone: string;
  division: string;
  lat: number;
  lon: number;
}

export interface TrainRouteResult {
  train_number: string;
  train_name: string;
  source: { code: string; name: string };
  destination: { code: string; name: string };
  run_days: string[];
  classes: string[];
  stops: TrainRouteStop[];
  geometry: { type: "LineString"; coordinates: number[][] };
  total_distance_km: number;
}

export interface LiveStatusStop {
  stationCode: string;
  stationName: string;
  arrivalTime: string;
  departureTime: string;
  haltMinutes: string;
  distance: string;
  day: number;
  arrivalDelay: string | null;
  departureDelay: string | null;
  lat: number;
  lon: number;
}

export interface LiveStatusResult {
  trainNo: string;
  trainName: string;
  stops: LiveStatusStop[];
  hasLiveData: boolean;
  nextStationIndex: number | null;
  geometry: { type: "LineString"; coordinates: number[][] };
}
