import { useState, useEffect, useRef } from "react";
import type { TrainSuggestion } from "../types";
import { searchTrainNumbers } from "../api/client";

export function useTrainSearch(query: string) {
  const [results, setResults] = useState<TrainSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const data = await searchTrainNumbers(query);
        if (!controller.signal.aborted) {
          setResults(data);
        }
      } catch {
        if (!controller.signal.aborted) {
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return { results, loading };
}
