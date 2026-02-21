import type { TrainRouteResult, Station } from "../../types";

interface Props {
  trainRoute: TrainRouteResult;
  onStationClick?: (station: Station) => void;
}

export default function TrainRouteDetails({ trainRoute, onStationClick }: Props) {
  const lastIdx = trainRoute.stops.length - 1;

  function handleStopClick(stop: { code: string; name: string; lat: number; lon: number }) {
    if (stop.lat !== 0 && stop.lon !== 0) {
      onStationClick?.({ code: stop.code, name: stop.name, lat: stop.lat, lon: stop.lon });
    }
  }

  return (
    <div className="space-y-3">
      {/* Train info header */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-700">{trainRoute.train_number}</span>
          <span className="text-gray-800 font-medium truncate">{trainRoute.train_name}</span>
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {trainRoute.source.code} &rarr; {trainRoute.destination.code}
        </div>
        {(trainRoute.run_days.length > 0 || trainRoute.classes.length > 0) && (
          <div className="flex flex-wrap gap-1 mt-2">
            {trainRoute.run_days.map((day) => (
              <span
                key={day}
                className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700"
              >
                {day}
              </span>
            ))}
            {trainRoute.classes.map((cls) => (
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

      {/* Distance summary */}
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Total Distance</span>
          <span className="font-semibold">{trainRoute.total_distance_km} km</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-600">Stops</span>
          <span className="font-semibold">{trainRoute.stops.length}</span>
        </div>
      </div>

      {/* Stop list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Stops ({trainRoute.stops.length})
        </h3>
        <div className="max-h-[calc(100vh-520px)] overflow-auto">
          <ul className="space-y-0.5">
            {trainRoute.stops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === lastIdx;

              let bgClass = "hover:bg-gray-50";
              let dotClass = "w-1.5 h-1.5 bg-blue-400 rounded-full";
              let codeClass = "font-medium text-blue-600";

              if (isFirst) {
                bgClass = "bg-green-50";
                dotClass = "w-2 h-2 bg-green-500 rounded-full";
                codeClass = "font-semibold text-green-700";
              } else if (isLast) {
                bgClass = "bg-red-50";
                dotClass = "w-2 h-2 bg-red-500 rounded-full";
                codeClass = "font-semibold text-red-700";
              }

              return (
                <li
                  key={`${stop.seq}-${stop.code}`}
                  onClick={() => handleStopClick(stop)}
                  className={`px-2 py-1.5 rounded cursor-pointer text-sm ${bgClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`${dotClass} flex-shrink-0`} />
                    <span className={codeClass}>{stop.code}</span>
                    <span className="text-gray-600 truncate flex-1">{stop.name}</span>
                    <span className="text-[11px] text-gray-400 flex-shrink-0">
                      {stop.distance_km} km
                    </span>
                  </div>
                  <div className="flex items-center gap-3 ml-[calc(0.5rem+8px+0.5rem)] mt-0.5 text-[11px] text-gray-500">
                    {stop.arrival && stop.arrival !== "First" && (
                      <span>Arr: {stop.arrival}</span>
                    )}
                    {stop.departure && stop.departure !== "Last" && (
                      <span>Dep: {stop.departure}</span>
                    )}
                    {stop.halt_mins && stop.halt_mins !== "0" && (
                      <span>Halt: {stop.halt_mins}m</span>
                    )}
                    {stop.platform && (
                      <span>PF: {stop.platform}</span>
                    )}
                    {stop.day > 1 && (
                      <span>Day {stop.day}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
