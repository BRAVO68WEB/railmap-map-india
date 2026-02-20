import { useEffect } from "react";
import { GeoJSON, useMap } from "react-leaflet";
import L from "leaflet";
import type { RouteResult } from "../../types";

interface Props {
  route: RouteResult;
}

export default function RouteLayer({ route }: Props) {
  const map = useMap();

  useEffect(() => {
    // Auto-zoom to fit the route bounds
    const coords = route.geometry.coordinates;
    if (coords.length > 0) {
      const bounds = L.latLngBounds(
        coords.map(([lng, lat]) => [lat, lng] as [number, number])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route, map]);

  const geojson: GeoJSON.Feature = {
    type: "Feature",
    properties: {},
    geometry: route.geometry as GeoJSON.Geometry,
  };

  return (
    <GeoJSON
      key={JSON.stringify(route.geometry.coordinates.slice(0, 3))}
      data={geojson}
      style={{
        color: "#dc2626",
        weight: 4,
        opacity: 0.85,
      }}
    />
  );
}
