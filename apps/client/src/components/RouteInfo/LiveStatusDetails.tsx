import type { LiveStatusResult, Station } from "../../types";

interface Props {
  liveStatus: LiveStatusResult;
  onStationClick?: (station: Station) => void;
}

function isDelayPresent(delay: string | null): boolean {
  return !!delay && delay !== "-" && delay !== "--";
}

function DelayBadge({ delay }: { delay: string | null }) {
  if (!isDelayPresent(delay)) {
    return null;
  }

  const isOnTime =
    delay === "0 Min" || delay === "00 Min" || delay === "RIGHT TIME";
  const isLate = !isOnTime;

  return (
    <span
      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
        isLate
          ? "bg-red-100 text-red-700"
          : "bg-green-100 text-green-700"
      }`}
    >
      {isOnTime ? "On Time" : delay}
    </span>
  );
}

export default function LiveStatusDetails({ liveStatus, onStationClick }: Props) {
  const lastIdx = liveStatus.stops.length - 1;

  function handleStopClick(stop: { stationCode: string; stationName: string; lat: number; lon: number }) {
    if (stop.lat !== 0 && stop.lon !== 0) {
      onStationClick?.({
        code: stop.stationCode,
        name: stop.stationName,
        lat: stop.lat,
        lon: stop.lon,
      });
    }
  }

  return (
    <div className="space-y-3">
      {/* Train info header */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-700">{liveStatus.trainNo}</span>
          <span className="text-gray-800 font-medium truncate">{liveStatus.trainName}</span>
        </div>
        {liveStatus.hasLiveData ? (
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-700 font-medium">Live tracking available</span>
          </div>
        ) : (
          <div className="mt-2 p-2 bg-amber-50 rounded text-xs text-amber-700">
            Live data not available for this date. Try selecting a different date.
          </div>
        )}
      </div>

      {/* Stop list */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Schedule ({liveStatus.stops.length} stops)
        </h3>
        <div className="max-h-[calc(100vh-480px)] overflow-auto">
          <ul className="space-y-0.5">
            {liveStatus.stops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === lastIdx;
              const isNext = idx === liveStatus.nextStationIndex;

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
              } else if (isNext) {
                bgClass = "bg-blue-50 ring-1 ring-blue-200";
                dotClass = "w-2 h-2 bg-blue-500 rounded-full animate-pulse";
                codeClass = "font-semibold text-blue-700";
              }

              return (
                <li
                  key={`${idx}-${stop.stationCode}`}
                  onClick={() => handleStopClick(stop)}
                  className={`px-2 py-1.5 rounded cursor-pointer text-sm ${bgClass}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`${dotClass} flex-shrink-0`} />
                    <span className={codeClass}>{stop.stationCode}</span>
                    <span className="text-gray-600 truncate flex-1">{stop.stationName}</span>
                    {isNext && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-medium flex-shrink-0">
                        NEXT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-[calc(0.5rem+8px+0.5rem)] mt-0.5 text-[11px] text-gray-500">
                    {stop.arrivalTime && stop.arrivalTime !== "00:00" && (
                      <span className="flex items-center gap-1">
                        Arr: {stop.arrivalTime}
                        <DelayBadge delay={stop.arrivalDelay} />
                      </span>
                    )}
                    {stop.departureTime && stop.departureTime !== "00:00" && (
                      <span className="flex items-center gap-1">
                        Dep: {stop.departureTime}
                        <DelayBadge delay={stop.departureDelay} />
                      </span>
                    )}
                    {stop.haltMinutes && stop.haltMinutes !== "--" && stop.haltMinutes !== "0" && (
                      <span>Halt: {stop.haltMinutes}m</span>
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
