import { useState } from "react";
import RailwayMap from "./components/Map/RailwayMap";
import RouteForm from "./components/Search/RouteForm";
import RouteDetails from "./components/RouteInfo/RouteDetails";
import TrainList from "./components/RouteInfo/TrainList";
import { useRoute } from "./hooks/useRoute";
import type { Station } from "./types";

export default function App() {
  const { route, trains, loading, trainsLoading, error, fetchRoute, clearRoute } = useRoute();
  const [focusStation, setFocusStation] = useState<Station | null>(null);

  return (
    <div className="h-full flex">
      {/* Sidebar */}
      <div className="w-[360px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-900">
            Indian Railway Map
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Find shortest railway routes between stations
          </p>
        </div>

        <div className="p-4 flex-1 overflow-auto">
          <RouteForm onSearch={fetchRoute} loading={loading} />

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          {route && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">
                  Route Found
                </h2>
                <button
                  onClick={clearRoute}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <RouteDetails
                route={route}
                onStationClick={setFocusStation}
              />
              <TrainList trains={trains} loading={trainsLoading} />
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <RailwayMap route={route} focusStation={focusStation} />
      </div>
    </div>
  );
}
