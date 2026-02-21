import type { Station, RouteResult, Train, TrainSuggestion, TrainRouteResult, LiveStatusResult } from "../types";

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

export async function searchTrainNumbers(query: string): Promise<TrainSuggestion[]> {
  const res = await fetch(`${BASE}/train-route/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error("Train search failed");
  return res.json();
}

export async function getTrainRoute(trainNo: string): Promise<TrainRouteResult> {
  const res = await fetch(`${BASE}/train-route?trainNo=${encodeURIComponent(trainNo)}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Train route request failed");
  }
  return res.json();
}

export async function getLiveStatus(trainNo: string, date?: string): Promise<LiveStatusResult> {
  const params = new URLSearchParams({ trainNo });
  if (date) params.set("date", date);
  const res = await fetch(`${BASE}/live-status?${params}`);
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Live status request failed");
  }
  return res.json();
}
