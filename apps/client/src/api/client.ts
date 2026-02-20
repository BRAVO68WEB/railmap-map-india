import type { Station, RouteResult, Train } from "../types";

const BASE = "/api";

export async function searchStations(query: string): Promise<Station[]> {
  const res = await fetch(`${BASE}/stations/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Search failed");
  return res.json();
}

export async function getRoute(from: string, to: string): Promise<RouteResult> {
  const res = await fetch(
    `${BASE}/route?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Route request failed");
  }
  return res.json();
}

export async function getTrains(from: string, to: string): Promise<Train[]> {
  const res = await fetch(
    `${BASE}/trains?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
  );
  if (!res.ok) return [];
  const data = await res.json();
  return data.trains || [];
}
