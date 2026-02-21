import { useState, useMemo } from "react";
import RailwayMap from "./components/Map/RailwayMap";
import RouteForm from "./components/Search/RouteForm";
import SearchModeToggle from "./components/Search/SearchModeToggle";
import TrainSearchForm from "./components/Search/TrainSearchForm";
import LiveStatusForm from "./components/Search/LiveStatusForm";
import RouteDetails from "./components/RouteInfo/RouteDetails";
import TrainList from "./components/RouteInfo/TrainList";
import TrainRouteDetails from "./components/RouteInfo/TrainRouteDetails";
import LiveStatusDetails from "./components/RouteInfo/LiveStatusDetails";
import { useRoute } from "./hooks/useRoute";
import { useTrainRoute } from "./hooks/useTrainRoute";
import { useLiveStatus } from "./hooks/useLiveStatus";
import type { Station, RouteResult, TrainRouteResult, LiveStatusResult } from "./types";

function trainRouteToMapData(tr: TrainRouteResult): RouteResult {
  const firstStop = tr.stops[0];
  const lastStop = tr.stops[tr.stops.length - 1];
  const intermediateStops = tr.stops.slice(1, -1);

  return {
    geometry: tr.geometry,
    distance_km: tr.total_distance_km,
    duration_hours: null,
    from: {
      code: firstStop.code,
      name: firstStop.name,
      lat: firstStop.lat,
      lon: firstStop.lon,
    },
    to: {
      code: lastStop.code,
      name: lastStop.name,
      lat: lastStop.lat,
      lon: lastStop.lon,
    },
    intermediate_stations: intermediateStops
      .filter((s) => s.lat !== 0 && s.lon !== 0)
      .map((s) => ({
        code: s.code,
        name: s.name,
        lat: s.lat,
        lon: s.lon,
      })),
    rbs_route: null,
    route_source: "rbs",
  };
}

function liveStatusToMapData(ls: LiveStatusResult): RouteResult {
  const validStops = ls.stops.filter((s) => s.lat !== 0 && s.lon !== 0);
  const firstStop = validStops[0] || ls.stops[0];
  const lastStop = validStops[validStops.length - 1] || ls.stops[ls.stops.length - 1];
  const intermediateStops = validStops.slice(1, -1);

  return {
    geometry: ls.geometry,
    distance_km: parseFloat(ls.stops[ls.stops.length - 1].distance) || 0,
    duration_hours: null,
    from: { code: firstStop.stationCode, name: firstStop.stationName, lat: firstStop.lat, lon: firstStop.lon },
    to: { code: lastStop.stationCode, name: lastStop.stationName, lat: lastStop.lat, lon: lastStop.lon },
    intermediate_stations: intermediateStops.map((s) => ({
      code: s.stationCode,
      name: s.stationName,
      lat: s.lat,
      lon: s.lon,
    })),
    rbs_route: null,
    route_source: "rbs",
  };
}

export default function App() {
  const [searchMode, setSearchMode] = useState<"stations" | "trainNo" | "liveStatus">("stations");
  const { route, trains, loading, trainsLoading, error, fetchRoute, clearRoute } = useRoute();
  const {
    trainRoute,
    loading: trainRouteLoading,
    error: trainRouteError,
    fetchTrainRoute,
    clearTrainRoute,
  } = useTrainRoute();
  const {
    liveStatus,
    loading: liveStatusLoading,
    error: liveStatusError,
    fetchLiveStatus,
    clearLiveStatus,
  } = useLiveStatus();
  const [focusStation, setFocusStation] = useState<Station | null>(null);

  function handleModeChange(mode: "stations" | "trainNo" | "liveStatus") {
    setSearchMode(mode);
    clearRoute();
    clearTrainRoute();
    clearLiveStatus();
    setFocusStation(null);
  }

  const mapRoute =
    searchMode === "trainNo" && trainRoute
      ? trainRouteToMapData(trainRoute)
      : searchMode === "liveStatus" && liveStatus
        ? liveStatusToMapData(liveStatus)
        : route;

  const currentError =
    searchMode === "stations"
      ? error
      : searchMode === "trainNo"
        ? trainRouteError
        : liveStatusError;

  // Compute the blinking station for the next upcoming stop in live status mode
  const blinkStation = useMemo<Station | null>(() => {
    if (searchMode !== "liveStatus" || !liveStatus || liveStatus.nextStationIndex == null) {
      return null;
    }
    const stop = liveStatus.stops[liveStatus.nextStationIndex];
    if (!stop || stop.lat === 0 || stop.lon === 0) return null;
    return {
      code: stop.stationCode,
      name: stop.stationName,
      lat: stop.lat,
      lon: stop.lon,
    };
  }, [searchMode, liveStatus]);

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
          <SearchModeToggle mode={searchMode} onChange={handleModeChange} />

          {searchMode === "stations" ? (
            <RouteForm onSearch={fetchRoute} loading={loading} />
          ) : searchMode === "trainNo" ? (
            <TrainSearchForm onSearch={fetchTrainRoute} loading={trainRouteLoading} />
          ) : (
            <LiveStatusForm onSearch={fetchLiveStatus} loading={liveStatusLoading} />
          )}

          {currentError && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
              {currentError}
            </div>
          )}

          {searchMode === "stations" && route && (
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

          {searchMode === "trainNo" && trainRoute && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">
                  Train Route
                </h2>
                <button
                  onClick={clearTrainRoute}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <TrainRouteDetails
                trainRoute={trainRoute}
                onStationClick={setFocusStation}
              />
            </div>
          )}

          {searchMode === "liveStatus" && liveStatus && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-gray-700">
                  Running Status
                </h2>
                <button
                  onClick={clearLiveStatus}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear
                </button>
              </div>
              <LiveStatusDetails
                liveStatus={liveStatus}
                onStationClick={setFocusStation}
              />
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1">
        <RailwayMap
          route={mapRoute}
          focusStation={focusStation}
          blinkStation={blinkStation}
        />
      </div>
    </div>
  );
}
