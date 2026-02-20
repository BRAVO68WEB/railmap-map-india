const RBS_BASE = "https://enquiry.indianrail.gov.in";

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

export async function getRbsRoute(
  from: string,
  to: string
): Promise<RbsRoute | null> {
  try {
    // Step 1: POST to ShortPathServlet to establish session
    const step1 = await fetch(`${RBS_BASE}/ShortPath/ShortPathServlet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `${RBS_BASE}/ShortPath/`,
      },
      body: new URLSearchParams({
        srcCode: from.toUpperCase(),
        destCode: to.toUpperCase(),
        gaugeType: "S",
        distance: "coach",
        PageName: "ShortPath",
      }),
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
    });

    // Extract session cookie
    const setCookie = step1.headers.get("set-cookie");
    if (!setCookie) return null;

    const sessionMatch = setCookie.match(/JSESSIONID=([^;]+)/);
    if (!sessionMatch) return null;

    const cookie = `JSESSIONID=${sessionMatch[1]}`;

    // Step 2: POST to RbsMapServlet with session cookie
    const step2 = await fetch(`${RBS_BASE}/ShortPath/RbsMapServlet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `${RBS_BASE}/ShortPath/`,
      },
      body: new URLSearchParams({
        map: "rbs",
        PageName: "ShortPath",
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!step2.ok) return null;

    const data = await step2.json();

    // Parse distance (values are wrapped in arrays)
    const totalDistance = parseFloat(data.distance?.[0]) || 0;
    const srcCode = data.src?.[0] || from.toUpperCase();
    const destCode = data.dest?.[0] || to.toUpperCase();

    // Parse stations
    const rawStations = data.station;
    if (!Array.isArray(rawStations) || rawStations.length === 0) return null;

    const stations: RbsStation[] = [];
    for (const s of rawStations) {
      const lon = parseFloat(s.x?.[0]);
      const lat = parseFloat(s.y?.[0]);

      // Skip stations with missing coordinates
      if (!lon || !lat || (lon === 0 && lat === 0)) continue;

      stations.push({
        code: s.code?.[0] || "",
        name: s.name?.[0] || "",
        lat,
        lon,
        distance_km: parseFloat(s.distance?.[0]) || 0,
        gauge: s.gauge?.[0] || "",
      });
    }

    if (stations.length === 0) return null;

    return {
      stations,
      total_distance_km: totalDistance,
      from_code: srcCode,
      to_code: destCode,
    };
  } catch (err) {
    console.error("RBS route fetch failed:", err);
    return null;
  }
}
