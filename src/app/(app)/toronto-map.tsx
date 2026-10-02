"use client";

import Map from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

export const TORONTO = { latitude: 43.6532, longitude: -79.3832 };

export function TorontoMap() {
  return (
    <Map
      initialViewState={{ ...TORONTO, zoom: 12 }}
      mapStyle="https://tiles.openfreemap.org/styles/positron"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
