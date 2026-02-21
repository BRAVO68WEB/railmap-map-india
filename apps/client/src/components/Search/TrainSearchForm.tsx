import { useState } from "react";
import type { TrainSuggestion } from "../../types";
import TrainInput from "./TrainInput";

interface Props {
  onSearch: (trainNo: string) => void;
  loading: boolean;
}

export default function TrainSearchForm({ onSearch, loading }: Props) {
  const [selected, setSelected] = useState<TrainSuggestion | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected) {
      onSearch(selected.number);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TrainInput value={selected} onChange={setSelected} />
      <button
        type="submit"
        disabled={!selected || loading}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {loading ? "Finding Route..." : "Find Train Route"}
      </button>
    </form>
  );
}
