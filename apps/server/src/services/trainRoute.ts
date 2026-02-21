import { parseBitmask } from "./erail";

const OSRM_URL = process.env.OSRM_URL || "http://localhost:5001";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "X-Requested-With": "XMLHttpRequest",
  Referer: "https://erail.in/",
};

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

export async function searchTrainsByNumber(
  query: string
): Promise<TrainSuggestion[]> {
  const url = `https://erail.in/Rail/SearchTrains_External.ashx?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) return [];

  const json = await res.json();
  if (!json.suggestions || !Array.isArray(json.suggestions)) return [];

  return json.suggestions.map((text: string, i: number) => ({
    number: json.data[i] || text.split(" ")[0],
    displayText: text,
  }));
}

function normalizeTime(t: string): string {
  if (!t || t === "First" || t === "Last") return t;
  // "15.15" → "15:15"
  const idx = t.indexOf(".");
  if (idx !== -1) {
    return t.substring(0, idx) + ":" + t.substring(idx + 1);
  }
  return t;
}

export async function fetchTrainRoute(
  trainNo: string
): Promise<TrainRouteResult> {
  // Step 1: Fetch train details to get internal train ID (field 33)
  const detailsRes = await fetch(
    `https://erail.in/rail/getTrains.aspx?TrainNo=${encodeURIComponent(trainNo)}&DataSource=0&Language=0&Cache=true`,
    { headers: HEADERS, signal: AbortSignal.timeout(8000) }
  );

  if (!detailsRes.ok) {
    throw new Error("Failed to fetch train details from eRail");
  }

  const detailsText = await detailsRes.text();

  // Parse train details
  const detailRecords = detailsText.split("^");
  if (detailRecords.length < 2) {
    throw new Error(`Train ${trainNo} not found`);
  }
  const fields = detailRecords[1].split("~");
  const trainName = fields[1]?.trim() || "";
  const sourceName = fields[2]?.trim() || "";
  const sourceCode = fields[3]?.trim() || "";
  const destName = fields[4]?.trim() || "";
  const destCode = fields[5]?.trim() || "";
  const runDaysBitmask = fields[13]?.trim() || "";
  const classesRaw = fields[14]?.trim() || "";
  const classes = classesRaw
    ? classesRaw.split(",").map((c: string) => c.trim()).filter(Boolean)
    : [];
  const runDays = parseBitmask(runDaysBitmask);

  // Internal train ID is at field index 33
  const internalTrainId = fields[33]?.trim() || "";
  if (!internalTrainId) {
    throw new Error(`Could not find internal ID for train ${trainNo}`);
  }

  // Step 2: Fetch route using internal train ID
  const routeRes = await fetch(
    `https://erail.in/data.aspx?Action=TRAINROUTE&Password=2012&Data1=${encodeURIComponent(internalTrainId)}&Data2=0&Cache=true`,
    { headers: HEADERS, signal: AbortSignal.timeout(8000) }
  );

  if (!routeRes.ok) {
    throw new Error("Failed to fetch train route from eRail");
  }

  const routeText = await routeRes.text();

  // Parse route stops — first segment before first ^ may contain fare data, skip it
  const stopRecords = routeText.split("^").slice(1).filter((r) => r.trim().length > 0);
  const stops: TrainRouteStop[] = [];
  const coordinates: number[][] = [];

  for (const record of stopRecords) {
    const f = record.split("~");
    if (f.length < 16) continue;

    const lat = parseFloat(f[14]) || 0;
    const lon = parseFloat(f[15]) || 0;

    const stop: TrainRouteStop = {
      seq: parseInt(f[0]) || 0,
      code: f[1]?.trim() || "",
      name: f[2]?.trim() || "",
      arrival: normalizeTime(f[3]?.trim() || ""),
      departure: normalizeTime(f[4]?.trim() || ""),
      halt_mins: f[5]?.trim() || "",
      distance_km: parseInt(f[6]) || 0,
      day: parseInt(f[7]) || 1,
      platform: f[8]?.trim() || "",
      zone: f[10]?.trim() || "",
      division: f[11]?.trim() || "",
      lat,
      lon,
    };

    stops.push(stop);

    if (lat !== 0 && lon !== 0) {
      coordinates.push([lon, lat]);
    }
  }

  if (stops.length === 0) {
    throw new Error(`No route data found for train ${trainNo}`);
  }

  const lastStop = stops[stops.length - 1];
  const totalDistance = lastStop.distance_km;

  // Try to get detailed geometry from OSRM using all stop waypoints
  let detailedCoordinates: number[][] | null = null;
  if (coordinates.length >= 2) {
    try {
      const waypoints = coordinates.map(([lon, lat]) => `${lon},${lat}`).join(";");
      const osrmUrl = `${OSRM_URL}/route/v1/train/${waypoints}?overview=full&geometries=geojson`;
      const osrmRes = await fetch(osrmUrl, { signal: AbortSignal.timeout(10000) });
      if (osrmRes.ok) {
        const osrmData = await osrmRes.json();
        if (osrmData.code === "Ok" && osrmData.routes?.length) {
          detailedCoordinates = osrmData.routes[0].geometry.coordinates;
        }
      }
    } catch {
      // OSRM unavailable — fall back to straight-line geometry
    }
  }

  return {
    train_number: trainNo,
    train_name: trainName,
    source: { code: sourceCode, name: sourceName },
    destination: { code: destCode, name: destName },
    run_days: runDays,
    classes,
    stops,
    geometry: { type: "LineString", coordinates: detailedCoordinates ?? coordinates },
    total_distance_km: totalDistance,
  };
}
