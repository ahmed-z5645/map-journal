"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

// react-easy-crop can report values a hair outside 0–100.
const frac = (pct: number) => Math.min(1, Math.max(0, pct / 100));

type Shape = "original" | "square" | "landscape" | "portrait";
const SHAPES: { id: Shape; label: string; aspect?: number }[] = [
  { id: "original", label: "Original shape" },
  { id: "square", label: "Square", aspect: 1 },
  { id: "landscape", label: "4:3", aspect: 4 / 3 },
  { id: "portrait", label: "3:4", aspect: 3 / 4 },
];

/** Optional crop of a polaroid's stored original; reports the area as 0–1 fractions, or null for the whole photo. */
export function CropDialog({
  imageUrl,
  busy,
  onCancel,
  onApply,
}: {
  imageUrl: string;
  busy: boolean;
  onCancel: () => void;
  onApply: (crop: { x: number; y: number; width: number; height: number } | null) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [area, setArea] = useState<Area>();
  const [shape, setShape] = useState<Shape>("original");
  const [naturalAspect, setNaturalAspect] = useState(4 / 3);
  const aspect = SHAPES.find((s) => s.id === shape)?.aspect ?? naturalAspect;

  const button = (active: boolean) =>
    `rounded-md px-3 py-1.5 text-sm ${active ? "bg-stone-100 text-stone-900" : "bg-stone-700"}`;

  return (
    <div role="dialog" aria-modal="true" aria-label="Crop photo" className="fixed inset-0 z-50 flex flex-col bg-stone-900/95">
      <div className="relative min-h-0 flex-1">
        <Cropper
          image={imageUrl}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={(pct) => setArea(pct)}
          onMediaLoaded={({ naturalWidth, naturalHeight }) => setNaturalAspect(naturalWidth / naturalHeight)}
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 bg-stone-900 p-4 text-stone-100">
        {SHAPES.map((s) => (
          <button key={s.id} type="button" onClick={() => setShape(s.id)} className={button(shape === s.id)}>
            {s.label}
          </button>
        ))}
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => setZoom(Number(e.target.value))}
          aria-label="Zoom"
          className="w-32"
        />
        <div className="ml-auto flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={() => onApply(null)} className="rounded-md px-3 py-1.5 text-sm underline disabled:opacity-50">
            Use full photo
          </button>
          <button type="button" onClick={onCancel} className="rounded-md px-3 py-1.5 text-sm">
            Cancel
          </button>
          <button
            type="button"
            disabled={!area || busy}
            onClick={() =>
              area &&
              onApply({ x: frac(area.x), y: frac(area.y), width: frac(area.width), height: frac(area.height) })
            }
            className="rounded-md bg-stone-100 px-3 py-1.5 text-sm text-stone-900 disabled:opacity-50"
          >
            {busy ? "Cropping…" : "Apply crop"}
          </button>
        </div>
      </div>
    </div>
  );
}
