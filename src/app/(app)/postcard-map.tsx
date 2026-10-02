"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import Map, { Marker, Popup, type MarkerDragEvent } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { DEFAULT_FRONT_COLOR } from "@/lib/postcard";
import { MAP_STYLE, TORONTO } from "@/lib/map";
import { moveCard } from "./map-actions";


export type MapCard = {
  id: string;
  status: "draft" | "published";
  lat: number | null;
  lng: number | null;
  frontColor: string | null;
  thumbUrl: string | null;
  title: string | null;
  quickNote: string | null;
  capturedAt: string;
};

type Located = MapCard & { lat: number; lng: number };
type Move = { id: string; from: { lat: number | null; lng: number | null } };

const isLocated = (c: MapCard): c is Located => c.lat !== null && c.lng !== null;

const formatDate = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { dateStyle: "medium" });

function CardFront({ card, className }: { card: MapCard; className: string }) {
  return card.thumbUrl ? (
    // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
    <img src={card.thumbUrl} alt={card.title ?? ""} className={`${className} object-cover`} />
  ) : (
    <div className={className} style={{ background: card.frontColor ?? DEFAULT_FRONT_COLOR }} />
  );
}

export function PostcardMap({ cards: initialCards, focusId }: { cards: MapCard[]; focusId?: string }) {
  const [cards, setCards] = useState(initialCards);
  const [arranging, setArranging] = useState(false);
  const [placingId, setPlacingId] = useState<string>();
  const [selectedId, setSelectedId] = useState(focusId);
  const [lastMove, setLastMove] = useState<Move>();
  const [error, setError] = useState<string>();
  const [, startSaving] = useTransition();

  // Server data wins whenever the page re-renders (e.g. after revalidation).
  useEffect(() => setCards(initialCards), [initialCards]);

  const visible = cards.filter(isLocated).filter((c) => arranging || c.status === "published");
  const unplaced = cards.filter((c) => c.status === "draft" && !isLocated(c));
  const selected = visible.find((c) => c.id === selectedId);
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
              aria-label={card.title ?? "Postcard"}
              className={[
                "h-3.5 w-5 rounded-[2px] border-2 border-white bg-stone-700 shadow-md",
                arranging ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
                card.status === "draft" ? "border-dashed opacity-60" : "",
              ].join(" ")}
            />
          </Marker>
        ))}

        {selected && (
          <Popup
            latitude={selected.lat}
            longitude={selected.lng}
            anchor="bottom"
            offset={14}
            closeButton={false}
            onClose={() => setSelectedId(undefined)}
            maxWidth="240px"
          >
            <div className="w-52">
              <CardFront card={selected} className="aspect-[3/2] w-full rounded-sm" />
              <p className="mt-2 truncate font-hand text-lg leading-tight">
                {selected.title ?? selected.quickNote ?? "Untitled"}
              </p>
              <div className="flex items-baseline justify-between text-xs text-stone-500">
                <span>{formatDate(selected.capturedAt)}</span>
                <Link href={`/cards/${selected.id}/edit`} className="underline">
                  Edit
                </Link>
              </div>
            </div>
          </Popup>
        )}
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
              <span>Tap the map where this card belongs.</span>
              <button type="button" onClick={() => setPlacingId(undefined)} className="underline">
                Cancel
              </button>
            </div>
          ) : (
            <>
              <p className="text-stone-600">
                Drag any card to move it. Faded cards are drafts.
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
                          className="block w-20 text-left"
                        >
                          <CardFront card={card} className="h-12 w-20 rounded-sm" />
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

      {error && (
        <p role="alert" className="absolute top-3 left-3 rounded-md bg-red-50 px-3 py-1.5 text-sm text-red-800 shadow">
          {error}
        </p>
      )}
    </div>
  );
}
