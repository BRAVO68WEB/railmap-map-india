import { useState } from "react";
import type { TrainSuggestion } from "../../types";
import TrainInput from "./TrainInput";

interface Props {
  onSearch: (trainNo: string, date?: string) => void;
  loading: boolean;
}

function getTodayStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function LiveStatusForm({ onSearch, loading }: Props) {
  const [selected, setSelected] = useState<TrainSuggestion | null>(null);
  const [date, setDate] = useState(getTodayStr());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected) {
      onSearch(selected.number, date || undefined);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <TrainInput value={selected} onChange={setSelected} />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Date
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
        />
      </div>
      <button
        type="submit"
        disabled={!selected || loading}
        className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors text-sm"
      >
        {loading ? "Checking..." : "Check Status"}
      </button>
    </form>
  );
}
