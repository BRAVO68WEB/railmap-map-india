import type { Train } from "./trains";

export async function fetchTrainsRailYatri(
  from: string,
  to: string
): Promise<Train[]> {
  try {
    const now = new Date();
    const journeyDate = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;

    const url = new URL(
      "https://trainticketapi.railyatri.in/api/trains-between-station-with-sa.json"
    );
    url.searchParams.set("from_code", from.toUpperCase());
    url.searchParams.set("to_code", to.toUpperCase());
    url.searchParams.set("journey_date", journeyDate);
    url.searchParams.set("src", "new_tbs");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Origin: "https://www.railyatri.in",
        Referer: "https://www.railyatri.in/",
        lang: "en",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.success || !Array.isArray(data.train_between_stations)) return [];

    return data.train_between_stations.map((t: any) => ({
      number: String(t.train_number || ""),
      name: String(t.train_name || ""),
      from: {
        code: from.toUpperCase(),
        departure: String(t.from_std || ""),
      },
      to: {
        code: to.toUpperCase(),
        arrival: String(t.to_sta || ""),
      },
      duration: String(t.duration || ""),
      distance_km: t.distance ? Number(t.distance) : null,
      run_days: parseRunDays(t.run_days),
      classes: Array.isArray(t.class_type)
        ? t.class_type.map((c: any) => String(c.coach_type || ""))
        : [],
      source: "railyatri" as const,
    }));
  } catch (err) {
    console.error("RailYatri fetch failed:", err);
    return [];
  }
}

function parseRunDays(runDays: any): string[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (typeof runDays === "string" && runDays.length === 7) {
    return dayNames.filter((_, i) => runDays[i] === "1");
  }
  if (Array.isArray(runDays)) {
    return dayNames.filter((_, i) => runDays[i] === 1 || runDays[i] === "1");
  }
  return [];
}
