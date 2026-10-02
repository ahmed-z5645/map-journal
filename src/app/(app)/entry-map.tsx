"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Map, { Marker, type MapRef, type MarkerDragEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/lib/maplibre-setup";
import type { EntryKind, EntryView } from "@/components/entry";
import { EntryModal } from "@/components/entry-modal";
import { EntryPin, EntryThumb } from "@/components/entry-thumb";
import { PersonFilter } from "@/components/person-filter";
import { formatDate } from "@/lib/dates";
import { MAP_STYLE, TORONTO } from "@/lib/map";
import { moveCard } from "./map-actions";


export type MapCard = {
  id: string;
  status: "draft" | "published";
  kind: EntryKind;
  lat: number | null;
  lng: number | null;
  thumbUrl: string | null;
  title: string | null;
  quickNote: string | null;
  capturedAt: string;
  view: EntryView;
};

type Located = MapCard & { lat: number; lng: number };
type Move = { id: string; from: { lat: number | null; lng: number | null } };

const isLocated = (c: MapCard): c is Located => c.lat !== null && c.lng !== null;

type Person = { id: string; name: string; count: number };

/** Frames the given cards: one card gets a close zoom, several get fitted bounds. */
function frameCards(map: MapRef, cards: Located[], animate: boolean) {
  const duration = animate ? 800 : 0;
  if (cards.length === 0) return;
  if (cards.length === 1) {
    map.flyTo({ center: [cards[0].lng, cards[0].lat], zoom: 14, duration });
    return;
  }
  const lngs = cards.map((c) => c.lng);
  const lats = cards.map((c) => c.lat);
  map.fitBounds(
    [
      [Math.min(...lngs), Math.min(...lats)],
      [Math.max(...lngs), Math.max(...lats)],
    ],
    { padding: 80, maxZoom: 15, duration },
  );
}

export function EntryMap({
  cards: initialCards,
  focusId,
  people,
  person,
}: {
  cards: MapCard[];
  focusId?: string;
  people: Person[];
  person?: Person;
}) {
  const mapRef = useRef<MapRef>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const framedPerson = useRef<string | undefined>(undefined);
  const [cards, setCards] = useState(initialCards);
  const [arranging, setArranging] = useState(false);
  const [placingId, setPlacingId] = useState<string>();
  const [selectedId, setSelectedId] = useState(focusId);
  const [lastMove, setLastMove] = useState<Move>();
  const [error, setError] = useState<string>();
  const [, startSaving] = useTransition();

  // Server data wins whenever the page re-renders (e.g. after revalidation).
  useEffect(() => setCards(initialCards), [initialCards]);

  // When the person filter changes, frame their cards (or everything, when cleared).
  // On first load only frame if a filter is set and no single card was asked for.
  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const firstRun = framedPerson.current === undefined;
    const personId = person?.id ?? "";
    if (!firstRun && framedPerson.current === personId) return;
    framedPerson.current = personId;
    if (firstRun && (!person || focusId)) return;
    frameCards(
      mapRef.current,
      initialCards.filter(isLocated).filter((c) => c.status === "published"),
      !firstRun,
    );
  }, [mapLoaded, person, focusId, initialCards]);

  const visible = cards.filter(isLocated).filter((c) => arranging || c.status === "published");
  const unplaced = cards.filter((c) => c.status === "draft" && !isLocated(c));
  const selected = visible.find((c) => c.id === selectedId);
  const closeModal = useCallback(() => {
    setSelectedId(undefined);
    // Drop ?card= (set after publishing) so a refresh doesn't reopen it; keep ?person=.
    const url = new URL(window.location.href);
    if (url.searchParams.has("card")) {
      url.searchParams.delete("card");
      window.history.replaceState(null, "", url.pathname + url.search);
    }
  }, []);
  const focus = cards.filter(isLocated).find((c) => c.id === focusId);

  function setLocation(id: string, to: { lat: number | null; lng: number | null }, recordUndo = true) {
    const card = cards.find((c) => c.id === id);
    if (!card) return;
    const from = { lat: card.lat, lng: card.lng };
    const apply = (loc: typeof to) => setCards((cs) => cs.map((c) => (c.id === id ? { ...c, ...loc } : c)));

    apply(to); // optimistic
    setError(undefined);
    setLastMove(recordUndo ? { id, from } : undefined);
    startSaving(async () => {
      const res = await moveCard({ id, ...to }).catch(() => ({ ok: false as const }));
      if (!res.ok) {
        apply(from);
        setLastMove(undefined);
        setError("Couldn't save that move. It's been put back.");
      }
    });
  }

  function toggleArranging() {
    setArranging((a) => !a);
    setPlacingId(undefined);
    setSelectedId(undefined);
    setLastMove(undefined);
  }

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        onLoad={() => setMapLoaded(true)}
        initialViewState={focus ? { latitude: focus.lat, longitude: focus.lng, zoom: 14 } : { ...TORONTO, zoom: 12 }}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        cursor={placingId ? "crosshair" : undefined}
        onClick={(e) => {
          if (placingId) {
            setLocation(placingId, { lat: e.lngLat.lat, lng: e.lngLat.lng });
            setPlacingId(undefined);
          } else {
            setSelectedId(undefined);
          }
        }}
      >
        {visible.map((card) => (
          <Marker
            key={card.id}
            latitude={card.lat}
            longitude={card.lng}
            anchor="center"
            draggable={arranging}
            onDragEnd={(e: MarkerDragEvent) => setLocation(card.id, { lat: e.lngLat.lat, lng: e.lngLat.lng })}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              if (!arranging) setSelectedId(card.id);
            }}
          >
            <div
              aria-label={card.title ?? (card.kind === "polaroid" ? "Polaroid" : "Note")}
              className={arranging ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
            >
              <EntryPin kind={card.kind} draft={card.status === "draft"} />
            </div>
          </Marker>
        ))}

      </Map>

      <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={toggleArranging}
          aria-pressed={arranging}
          className={`rounded-md px-3 py-1.5 text-sm shadow ${
            arranging ? "bg-stone-800 text-stone-50" : "bg-white text-stone-800"
          }`}
        >
          {arranging ? "Done arranging" : "Arrange"}
        </button>
        {arranging && lastMove && (
          <button
            type="button"
            onClick={() => setLocation(lastMove.id, lastMove.from, false)}
            className="rounded-md bg-white px-3 py-1.5 text-sm shadow"
          >
            Undo move
          </button>
        )}
      </div>

      {arranging && (
        <div className="absolute bottom-3 left-3 right-3 max-w-sm rounded-lg bg-white/95 p-3 text-sm shadow-lg sm:right-auto">
          {placingId ? (
            <div className="flex items-center justify-between gap-2">
              <span>Tap the map where this belongs.</span>
              <button type="button" onClick={() => setPlacingId(undefined)} className="underline">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <p className="text-stone-600">
                Drag anything to move it. Faded ones are drafts.
              </p>
              {unplaced.length > 0 && (
                <>
                  <p className="mt-2 font-medium">Needs a spot ({unplaced.length})</p>
                  <ul className="mt-1 flex gap-2 overflow-x-auto pb-1">
                    {unplaced.map((card) => (
                      <li key={card.id} className="shrink-0">
                        <button
                          type="button"
                          onClick={() => setPlacingId(card.id)}
                          title={card.quickNote ?? formatDate(card.capturedAt)}
                          className="block w-14 text-left"
                        >
                          <EntryThumb kind={card.kind} thumbUrl={card.thumbUrl} className="h-14 w-14 rounded-sm" />
                          <span className="block truncate text-xs text-stone-500">
                            {card.quickNote ?? formatDate(card.capturedAt)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </div>
      )}

      {selected && !arranging && (
        <EntryModal entry={selected.view} editHref={`/cards/${selected.id}/edit`} onClose={closeModal} />
      )}

      <PersonFilter people={people} selectedId={person?.id} className="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-1 shadow" />

      {error && (
        <p role="alert" className="absolute top-14 left-1/2 -translate-x-1/2 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-800 shadow">
          {error}
        </p>
      )}
    </div>
  );
}
