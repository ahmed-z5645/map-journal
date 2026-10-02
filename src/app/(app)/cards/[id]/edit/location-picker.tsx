"use client";

import Map, { Marker, type MarkerDragEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/lib/maplibre-setup";
import { MAP_STYLE, TORONTO } from "@/lib/map";

type Loc = { lat: number; lng: number } | null;

/** Small map: tap to place the card, drag the pin to adjust. */
export function LocationPicker({ value, onChange }: { value: Loc; onChange: (loc: Loc) => void }) {
  return (
    <div className="h-64 overflow-hidden rounded-lg border border-stone-300">
      <Map
        initialViewState={
          value ? { latitude: value.lat, longitude: value.lng, zoom: 15 } : { ...TORONTO, zoom: 11 }
        }
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        cursor="crosshair"
        onClick={(e) => onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
      >
        {value && (
          <Marker
            latitude={value.lat}
            longitude={value.lng}
            draggable
            onDragEnd={(e: MarkerDragEvent) => onChange({ lat: e.lngLat.lat, lng: e.lngLat.lng })}
          >
            <div className="h-3.5 w-5 cursor-grab rounded-[2px] border-2 border-white bg-stone-700 shadow-md" />
          </Marker>
        )}
      </Map>
    </div>
  );
}
