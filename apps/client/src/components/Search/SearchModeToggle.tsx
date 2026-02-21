interface Props {
  mode: "stations" | "trainNo" | "liveStatus";
  onChange: (mode: "stations" | "trainNo" | "liveStatus") => void;
}

export default function SearchModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
      <button
        onClick={() => onChange("stations")}
        className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${
          mode === "stations"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Between STNs
      </button>
      <button
        onClick={() => onChange("trainNo")}
        className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${
          mode === "trainNo"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        By Train No.
      </button>
      <button
        onClick={() => onChange("liveStatus")}
        className={`flex-1 text-xs font-medium py-1.5 px-3 rounded-md transition-all ${
          mode === "liveStatus"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        Live Status
      </button>
    </div>
  );
}
