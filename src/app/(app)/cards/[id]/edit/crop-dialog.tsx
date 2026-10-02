"use client";

import { useState } from "react";
import Cropper, { type Area } from "react-easy-crop";

// react-easy-crop can report values a hair outside 0–100.
const frac = (pct: number) => Math.min(1, Math.max(0, pct / 100));

const ASPECTS = [
  { label: "Landscape", value: 3 / 2 },
  { label: "Portrait", value: 2 / 3 },
];

/** Crops the stored original; reports the area as 0–1 fractions. */
export function CropDialog({
  imageUrl,
  initialAspect,
  busy,
  onCancel,
  onApply,
}: {
  imageUrl: string;
  initialAspect: number;
  busy: boolean;
  onCancel: () => void;
  onApply: (crop: { x: number; y: number; width: number; height: number }) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(initialAspect);
  const [area, setArea] = useState<Area>();

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
        />
      </div>
      <div className="flex flex-wrap items-center gap-3 bg-stone-900 p-4 text-stone-100">
        {ASPECTS.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={() => setAspect(a.value)}
            className={`rounded-md px-3 py-1.5 text-sm ${aspect === a.value ? "bg-stone-100 text-stone-900" : "bg-stone-700"}`}
          >
            {a.label}
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
        <div className="ml-auto flex gap-2">
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
