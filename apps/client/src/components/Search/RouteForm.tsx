import { useState } from "react";
import type { Station } from "../../types";
import StationInput from "./StationInput";

interface Props {
  onSearch: (from: string, to: string) => void;
  loading: boolean;
}

export default function RouteForm({ onSearch, loading }: Props) {
  const [from, setFrom] = useState<Station | null>(null);
  const [to, setTo] = useState<Station | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (from && to) {
      onSearch(from.code, to.code);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <StationInput label="From" value={from} onChange={setFrom} />
      <StationInput label="To" value={to} onChange={setTo} />
      <button
        type="submit"
        disabled={!from || !to || loading}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {loading ? "Finding Route..." : "Find Route"}
      </button>
    </form>
  );
}
