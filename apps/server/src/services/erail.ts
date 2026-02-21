import type { Train } from "./trains";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export async function fetchTrainsErail(
  from: string,
  to: string
): Promise<Train[]> {
  try {
    const url = `https://erail.in/rail/getTrains.aspx?Station_From=${encodeURIComponent(from.toUpperCase())}&Station_To=${encodeURIComponent(to.toUpperCase())}&DataSource=0&Language=0&Cache=true`;

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://erail.in/trains-between-stations",
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return [];

    const text = await res.text();
    if (!text || text.trim().length === 0) return [];

    // Split by ^ to get records, skip the first header segment
    const records = text.split("^");
    if (records.length < 2) return [];

    const trains: Train[] = [];
    for (let i = 1; i < records.length; i++) {
      const fields = records[i].split("~");
      if (fields.length < 14) continue;

      const trainNumber = fields[0]?.trim();
      const trainName = fields[1]?.trim();
      const boardingCode = fields[7]?.trim() || from.toUpperCase();
      const alightingCode = fields[9]?.trim() || to.toUpperCase();
      const departure = fields[10]?.trim();
      const arrival = fields[11]?.trim();
      const duration = fields[12]?.trim();
      const runDaysBitmask = fields[13]?.trim();

      if (!trainNumber) continue;

      trains.push({
        number: trainNumber,
        name: trainName || "",
        from: { code: boardingCode, departure: departure || "" },
        to: { code: alightingCode, arrival: arrival || "" },
        duration: duration || "",
        distance_km: null,
        run_days: parseBitmask(runDaysBitmask || ""),
        classes: [],
        source: "erail",
      });
    }

    return trains;
  } catch (err) {
    console.error("eRail fetch failed:", err);
    return [];
  }
}

export function parseBitmask(bitmask: string): string[] {
  if (bitmask.length !== 7) return [];
  return DAY_NAMES.filter((_, i) => bitmask[i] === "1");
}
