import { useState } from "react";
import type { LiveStatusResult } from "../types";
import { getLiveStatus } from "../api/client";

export function useLiveStatus() {
  const [liveStatus, setLiveStatus] = useState<LiveStatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchLiveStatus(trainNo: string, date?: string) {
    setLoading(true);
    setError(null);
    try {
      const data = await getLiveStatus(trainNo, date);
      setLiveStatus(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch live status");
      setLiveStatus(null);
    } finally {
      setLoading(false);
    }
  }

  function clearLiveStatus() {
    setLiveStatus(null);
    setError(null);
  }

  return { liveStatus, loading, error, fetchLiveStatus, clearLiveStatus };
}
