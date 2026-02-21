import { getStationsByCodes } from "./stations";

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

const OSRM_URL = process.env.OSRM_URL || "http://localhost:5001";

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.5",
};

function formatDate(dateStr: string): string {
  // Convert YYYY-MM-DD to DD-MMM-YYYY
  const d = new Date(dateStr + "T00:00:00");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const dd = String(d.getDate()).padStart(2, "0");
  const mmm = months[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd}-${mmm}-${yyyy}`;
}

function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isDelayPresent(delay: string | null | undefined): boolean {
  return !!delay && delay !== "-" && delay !== "--" && delay !== "null";
}

export async function fetchLiveStatus(
  trainNo: string,
  date?: string
): Promise<LiveStatusResult> {
  const dateStr = date || getTodayStr();
  const formattedDate = formatDate(dateStr);
  const url = `https://www.confirmtkt.com/train-running-status/${encodeURIComponent(trainNo)}?Date=${formattedDate}`;

  const res = await fetch(url, {
    headers: HEADERS,
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch live status (HTTP ${res.status})`);
  }

  const html = await res.text();

  // Extract embedded JSON: var data = {...};
  // The data block ends with }; at end of line (no trailing var keyword)
  const match = html.match(/var\s+data\s*=\s*(\{.+\})\s*;/);
  if (!match) {
    throw new Error("Could not parse live status data from page");
  }

  let data: any;
  try {
    data = JSON.parse(match[1]);
  } catch {
    throw new Error("Failed to parse embedded JSON data");
  }

  const schedule = data.Schedule;
  if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
    throw new Error("No schedule data found for this train and date");
  }

  const trainName = data.TrainName || "";

  let hasLiveData = false;
  let lastDelayIndex = -1;

  const stops: LiveStatusStop[] = schedule.map((s: any, idx: number) => {
    const arrDelay = s.arrivalDelay ?? null;
    const depDelay = s.departureDelay ?? null;

    if (isDelayPresent(arrDelay) || isDelayPresent(depDelay)) {
      hasLiveData = true;
      lastDelayIndex = idx;
    }

    return {
      stationCode: s.StationCode || "",
      stationName: s.StationName || "",
      arrivalTime: s.ArrivalTime || "",
      departureTime: s.DepartureTime || "",
      haltMinutes: s.HaltMinutes || "--",
      distance: s.Distance || "0",
      day: s.Day || 1,
      arrivalDelay: arrDelay,
      departureDelay: depDelay,
      lat: s.Latitude || 0,
      lon: s.Longitude || 0,
    };
  });

  // Backfill missing coordinates from the database
  const missingCodes = stops
    .filter((s) => s.lat === 0 || s.lon === 0)
    .map((s) => s.stationCode);

  if (missingCodes.length > 0) {
    const dbCoords = await getStationsByCodes(missingCodes);
    for (const stop of stops) {
      if (stop.lat === 0 || stop.lon === 0) {
        const dbStation = dbCoords.get(stop.stationCode.toUpperCase());
        if (dbStation) {
          stop.lat = dbStation.lat;
          stop.lon = dbStation.lon;
        }
      }
    }
  }

  // Next upcoming station: the one right after the last station with delay data
  let nextStationIndex: number | null = null;
  if (hasLiveData && lastDelayIndex < stops.length - 1) {
    nextStationIndex = lastDelayIndex + 1;
  }

  // Build geometry via OSRM for proper rail routing
  const coordinates = stops
    .filter((s) => s.lat !== 0 && s.lon !== 0)
    .map((s) => [s.lon, s.lat]);

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
    trainNo,
    trainName,
    stops,
    hasLiveData,
    nextStationIndex,
    geometry: { type: "LineString", coordinates: detailedCoordinates ?? coordinates },
  };
}
