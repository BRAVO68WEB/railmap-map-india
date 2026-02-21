import { useState } from "react";
import type { TrainRouteResult } from "../types";
import { getTrainRoute } from "../api/client";

export function useTrainRoute() {
  const [trainRoute, setTrainRoute] = useState<TrainRouteResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchTrainRoute(trainNo: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getTrainRoute(trainNo);
      setTrainRoute(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch train route");
      setTrainRoute(null);
    } finally {
      setLoading(false);
    }
  }

  function clearTrainRoute() {
    setTrainRoute(null);
    setError(null);
  }

  return { trainRoute, loading, error, fetchTrainRoute, clearTrainRoute };
}
