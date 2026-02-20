import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Station } from "../../types";

interface Props {
  station: Station;
  type: "origin" | "destination" | "intermediate";
}

const ICONS = {
  origin: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-green.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  destination: new L.Icon({
    iconUrl:
      "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-red.png",
    shadowUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }),
  intermediate: new L.CircleMarker(L.latLng(0, 0), {
    radius: 5,
    fillColor: "#3b82f6",
    color: "#fff",
    weight: 2,
    fillOpacity: 0.8,
  }),
};

export default function StationMarker({ station, type }: Props) {
  if (type === "intermediate") {
    return (
      <Marker
        position={[station.lat, station.lon]}
        icon={L.divIcon({
          className: "",
          html: `<div style="width:10px;height:10px;background:#3b82f6;border:2px solid #fff;border-radius:50%;box-shadow:0 1px 3px rgba(0,0,0,0.3);"></div>`,
          iconSize: [10, 10],
          iconAnchor: [5, 5],
        })}
      >
        <Popup>
          <strong>{station.code}</strong> - {station.name}
        </Popup>
      </Marker>
    );
  }

  return (
    <Marker
      position={[station.lat, station.lon]}
      icon={type === "origin" ? ICONS.origin : ICONS.destination}
    >
      <Popup>
        <strong>{station.code}</strong> - {station.name}
      </Popup>
    </Marker>
  );
}
