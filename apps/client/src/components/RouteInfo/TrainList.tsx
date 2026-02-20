import { useState } from "react";
import type { Train } from "../../types";

interface Props {
  trains: Train[];
  loading: boolean;
}

export default function TrainList({ trains, loading }: Props) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mt-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700"
      >
        <span>
          Trains on this route
          {!loading && ` (${trains.length})`}
        </span>
        <span className="text-gray-400 text-xs">
          {expanded ? "\u25B2" : "\u25BC"}
        </span>
      </button>

      {expanded && (
        <div className="mt-2">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
              <span className="inline-block w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
              Loading trains...
            </div>
          )}

          {!loading && trains.length === 0 && (
            <p className="text-sm text-gray-400 py-2">
              No train data available
            </p>
          )}

          {!loading && trains.length > 0 && (
            <div className="space-y-2 max-h-[300px] overflow-auto">
              {trains.map((train) => (
                <div
                  key={`${train.number}-${train.source}`}
                  className="bg-gray-50 rounded-lg p-2.5 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-blue-700">
                      {train.number}
                    </span>
                    <span className="text-gray-700 truncate flex-1">
                      {train.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 uppercase">
                      {train.source}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-gray-600">
                    <span className="font-medium">{train.from.departure || "--:--"}</span>
                    <span className="text-gray-400 mx-1">&rarr;</span>
                    <span className="font-medium">{train.to.arrival || "--:--"}</span>
                    {train.duration && (
                      <span className="text-gray-400 ml-2">
                        ({train.duration})
                      </span>
                    )}
                    {train.distance_km && (
                      <span className="text-gray-400 ml-auto">
                        {train.distance_km} km
                      </span>
                    )}
                  </div>

                  {(train.run_days.length > 0 || train.classes.length > 0) && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {train.run_days.map((day) => (
                        <span
                          key={day}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
                        >
                          {day}
                        </span>
                      ))}
                      {train.classes.map((cls) => (
                        <span
                          key={cls}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700"
                        >
                          {cls}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
