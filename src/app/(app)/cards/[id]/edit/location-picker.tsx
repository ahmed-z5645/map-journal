"use client";

import Map, { Marker, type MarkerDragEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/lib/maplibre-setup";
import type { EntryKind } from "@/components/entry";
import { EntryPin } from "@/components/entry-thumb";
import { MAP_STYLE, TORONTO } from "@/lib/map";

type Loc = { lat: number; lng: number } | null;

/** Small map: tap to place the card, drag the pin to adjust. */
export function LocationPicker({ kind, value, onChange }: { kind: EntryKind; value: Loc; onChange: (loc: Loc) => void }) {
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
            <div className="cursor-grab">
              <EntryPin kind={kind} />
            </div>
          </Marker>
        )}
      </Map>
    </div>
  );
}
