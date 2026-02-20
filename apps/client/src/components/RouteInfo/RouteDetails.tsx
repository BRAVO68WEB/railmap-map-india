import type { RouteResult, Station } from "../../types";

interface Props {
  route: RouteResult;
  onStationClick?: (station: Station) => void;
}

export default function RouteDetails({ route, onStationClick }: Props) {
  return (
    <div className="space-y-3">
      <div className="bg-blue-50 rounded-lg p-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Distance</span>
          <span className="font-semibold flex items-center gap-1.5">
            {route.distance_km} km
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded uppercase font-medium ${
                route.route_source === "osrm"
                  ? "bg-blue-200 text-blue-700"
                  : "bg-amber-200 text-amber-700"
              }`}
            >
              {route.route_source}
            </span>
          </span>
        </div>
        {route.duration_hours != null && (
          <div className="flex justify-between text-sm mt-1">
            <span className="text-gray-600">Est. Duration</span>
            <span className="font-semibold">{route.duration_hours} hrs</span>
          </div>
        )}
        {route.rbs_route &&
          route.route_source === "osrm" &&
          Math.abs(route.rbs_route.total_distance_km - route.distance_km) > 1 && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-gray-600">Railway distance</span>
              <span className="font-semibold text-amber-700">
                {route.rbs_route.total_distance_km} km
              </span>
            </div>
          )}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-2">
          Route ({route.intermediate_stations.length + 2} stations)
        </h3>
        <div className="max-h-[calc(100vh-420px)] overflow-auto">
          <ul className="space-y-0.5">
            {/* Origin */}
            <li className="flex items-center gap-2 px-2 py-1.5 bg-green-50 rounded text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />
              <span className="font-semibold text-green-700">
                {route.from.code}
              </span>
              <span className="text-gray-600 truncate">{route.from.name}</span>
            </li>

            {/* Intermediate */}
            {route.intermediate_stations.map((s) => (
              <li
                key={s.code}
                onClick={() => onStationClick?.(s)}
                className="flex items-center gap-2 px-2 py-1 hover:bg-gray-50 rounded cursor-pointer text-sm"
              >
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                <span className="font-medium text-blue-600">{s.code}</span>
                <span className="text-gray-500 truncate">{s.name}</span>
              </li>
            ))}

            {/* Destination */}
            <li className="flex items-center gap-2 px-2 py-1.5 bg-red-50 rounded text-sm">
              <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
              <span className="font-semibold text-red-700">
                {route.to.code}
              </span>
              <span className="text-gray-600 truncate">{route.to.name}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
