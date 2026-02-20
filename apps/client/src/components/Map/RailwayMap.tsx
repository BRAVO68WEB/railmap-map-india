import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl } from "react-leaflet";
import L from "leaflet";
import type { RouteResult, Station } from "../../types";
import RouteLayer from "./RouteLayer";
import StationMarker from "./StationMarker";

interface Props {
  route: RouteResult | null;
  focusStation: Station | null;
}

function FocusHandler({ station }: { station: Station | null }) {
  const map = useMap();
  useEffect(() => {
    if (station) {
      map.setView([station.lat, station.lon], 12);
    }
  }, [station, map]);
  return null;
}

const rbsIcon = L.divIcon({
  className: "",
  html: `<div style="width:8px;height:8px;background:#f59e0b;border:1.5px solid #fff;transform:rotate(45deg);box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
  iconSize: [8, 8],
  iconAnchor: [4, 4],
});

export default function RailwayMap({ route, focusStation }: Props) {
  return (
    <MapContainer
      center={[22.5, 82.0]}
      zoom={5}
      className="h-full w-full"
      zoomControl={true}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="CartoDB Positron">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
            maxZoom={20}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OpenStreetMap">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="Railway Infrastructure">
          <TileLayer
            attribution='&copy; <a href="https://www.openrailwaymap.org/">OpenRailwayMap</a>'
            url="https://{s}.tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png"
            maxZoom={19}
            opacity={0.7}
          />
        </LayersControl.Overlay>
      </LayersControl>
      <FocusHandler station={focusStation} />
      {route && (
        <>
          <RouteLayer route={route} />
          <StationMarker station={route.from} type="origin" />
          <StationMarker station={route.to} type="destination" />
          {route.intermediate_stations.map((s) => (
            <StationMarker key={s.code} station={s} type="intermediate" />
          ))}
          {route.rbs_route?.stations
            .filter(
              (s) =>
                s.code !== route.from.code &&
                s.code !== route.to.code &&
                !route.intermediate_stations.some((is) => is.code === s.code)
            )
            .map((s) => (
              <Marker
                key={`rbs-${s.code}`}
                position={[s.lat, s.lon]}
                icon={rbsIcon}
              >
                <Popup>
                  <strong>{s.code}</strong> - {s.name}
                  <br />
                  <span style={{ fontSize: "11px", color: "#666" }}>
                    {s.distance_km} km from origin
                  </span>
                </Popup>
              </Marker>
            ))}
        </>
      )}
    </MapContainer>
  );
}
