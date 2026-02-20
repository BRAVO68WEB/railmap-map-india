const OSRM_URL = process.env.OSRM_URL || "http://localhost:5001";

export interface OsrmRoute {
  geometry: {
    type: string;
    coordinates: number[][];
  };
  distance: number; // meters
  duration: number; // seconds
}

export async function getRoute(
  fromLon: number,
  fromLat: number,
  toLon: number,
  toLat: number
): Promise<OsrmRoute> {
  const url = `${OSRM_URL}/route/v1/train/${fromLon},${fromLat};${toLon},${toLat}?overview=full&geometries=geojson`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.code !== "Ok" || !data.routes?.length) {
    throw new Error(`OSRM: no route found (${data.code})`);
  }

  const route = data.routes[0];
  return {
    geometry: route.geometry,
    distance: route.distance,
    duration: route.duration,
  };
}
