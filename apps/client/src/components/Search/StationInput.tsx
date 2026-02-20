import { useState, useRef } from "react";
import type { Station } from "../../types";
import { useStationSearch } from "../../hooks/useStationSearch";

interface Props {
  label: string;
  value: Station | null;
  onChange: (station: Station | null) => void;
}

export default function StationInput({ label, value, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading } = useStationSearch(query);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSelect(station: Station) {
    onChange(station);
    setQuery(`${station.code} - ${station.name}`);
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
        {label}
      </label>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={() => query.length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Type station code or name..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
      />
      {open && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((s) => (
            <li
              key={s.code}
              onMouseDown={() => handleSelect(s)}
              className="px-3 py-2 cursor-pointer hover:bg-blue-50 text-sm"
            >
              <span className="font-semibold text-blue-700">{s.code}</span>
              <span className="text-gray-600"> - {s.name}</span>
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
