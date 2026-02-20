import { fetchTrainsRailYatri } from "./railyatri";
import { fetchTrainsErail } from "./erail";

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

export async function searchTrains(
  from: string,
  to: string
): Promise<Train[]> {
  try {
    const [railYatriResult, erailResult] = await Promise.allSettled([
      fetchTrainsRailYatri(from, to),
      fetchTrainsErail(from, to),
    ]);

    const ryTrains =
      railYatriResult.status === "fulfilled" ? railYatriResult.value : [];
    const erTrains =
      erailResult.status === "fulfilled" ? erailResult.value : [];

    // Deduplicate by train number, preferring RailYatri data
    const trainMap = new Map<string, Train>();

    for (const t of ryTrains) {
      trainMap.set(t.number, t);
    }

    for (const t of erTrains) {
      if (!trainMap.has(t.number)) {
        trainMap.set(t.number, t);
      }
    }

    // Sort by departure time
    const trains = Array.from(trainMap.values());
    trains.sort((a, b) => {
      const da = a.from.departure || "99:99";
      const db = b.from.departure || "99:99";
      return da.localeCompare(db);
    });

    return trains;
  } catch (err) {
    console.error("Train search failed:", err);
    return [];
  }
}
