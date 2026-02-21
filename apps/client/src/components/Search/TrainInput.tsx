import { useState, useRef } from "react";
import type { TrainSuggestion } from "../../types";
import { useTrainSearch } from "../../hooks/useTrainSearch";

interface Props {
  value: TrainSuggestion | null;
  onChange: (train: TrainSuggestion | null) => void;
}

export default function TrainInput({ value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading } = useTrainSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(train: TrainSuggestion) {
    onChange(train);
    setQuery(train.displayText);
    setOpen(false);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    if (!e.target.value) onChange(null);
  }

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Train
      </label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Type train number or name..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((t) => (
            <li
              key={t.number}
              onMouseDown={() => handleSelect(t)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
            >
              <span className="font-semibold text-blue-700">{t.number}</span>
              <span className="text-gray-600"> - {(t.displayText || "").replace(t.number, "").replace(/^[\s-]+/, "")}</span>
            </li>
          ))}
        </ul>
      )}
      {open && loading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500">
          Searching...
        </div>
      )}
    </div>
  );
}
