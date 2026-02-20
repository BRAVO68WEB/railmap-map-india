import { useState } from "react";
import type { RouteResult, Train } from "../types";
import { getRoute, getTrains } from "../api/client";

export function useRoute() {
  const [route, setRoute] = useState<RouteResult | null>(null);
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [trainsLoading, setTrainsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRoute(from: string, to: string) {
    setLoading(true);
    setError(null);
    setTrains([]);
    try {
      const data = await getRoute(from, to);
      setRoute(data);

      // Automatically fetch trains after route is found
      setTrainsLoading(true);
      getTrains(from, to)
        .then(setTrains)
        .catch(() => setTrains([]))
        .finally(() => setTrainsLoading(false));
    } catch (err: any) {
      setError(err.message || "Failed to find route");
      setRoute(null);
    } finally {
      setLoading(false);
    }
  }

  function clearRoute() {
    setRoute(null);
    setTrains([]);
    setError(null);
  }

  return { route, trains, loading, trainsLoading, error, fetchRoute, clearRoute };
}
