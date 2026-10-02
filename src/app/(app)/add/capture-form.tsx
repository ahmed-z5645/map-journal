"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createDraft } from "./actions";
import { formatDateTime } from "@/lib/dates";
import { preparePhoto, type PhotoMeta } from "@/lib/prepare-photo";

type DeviceLocation =
  | { state: "locating" }
  | { state: "found"; lat: number; lng: number; accuracy: number }
  | { state: "unavailable"; reason: string };

type Photo = { blob: Blob; previewUrl: string; meta: PhotoMeta };

function useDeviceLocation() {
  const [loc, setLoc] = useState<DeviceLocation>({ state: "locating" });
  const locate = () => {
    if (!("geolocation" in navigator)) {
      setLoc({ state: "unavailable", reason: "Location isn't supported on this device." });
      return;
    }
    setLoc({ state: "locating" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLoc({
          state: "found",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      (err) =>
        setLoc({
          state: "unavailable",
          reason: err.code === err.PERMISSION_DENIED ? "Location permission denied." : "Couldn't get a location fix.",
        }),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 60_000 },
    );
  };
  useEffect(locate, []);
  return [loc, locate] as const;
}

export function CaptureForm() {
  const [device, relocate] = useDeviceLocation();
  const [photo, setPhoto] = useState<Photo>();
  const [preparing, setPreparing] = useState(false);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string }>();
  const [saving, startSaving] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => () => photo && URL.revokeObjectURL(photo.previewUrl), [photo]);

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    setMessage(undefined);
    setPreparing(true);
    try {
      const { blob, meta } = await preparePhoto(file);
      setPhoto({ blob, meta, previewUrl: URL.createObjectURL(blob) });
    } catch {
      setMessage({ kind: "error", text: "Couldn't read that photo. Try a JPEG or a different one." });
    } finally {
      setPreparing(false);
    }
  }

  // Photo GPS wins: it's where the picture was taken, which matters for photos picked from the library.
  const location =
    photo?.meta.lat !== undefined && photo.meta.lng !== undefined
      ? { lat: photo.meta.lat, lng: photo.meta.lng, accuracy: undefined, source: "photo" as const }
      : device.state === "found"
        ? { ...device, source: "device" as const }
        : undefined;

  function submit() {
    const fd = new FormData();
    if (photo) fd.set("photo", photo.blob, "photo.jpg");
    if (note.trim()) fd.set("note", note.trim());
    if (location) {
      fd.set("lat", String(location.lat));
      fd.set("lng", String(location.lng));
      if (location.accuracy !== undefined) fd.set("accuracy", String(location.accuracy));
    }
    if (photo?.meta.takenAt) fd.set("capturedAt", photo.meta.takenAt.toISOString());

    startSaving(async () => {
      const result = await createDraft(fd).catch(() => ({ ok: false as const, error: "Network error. Try again." }));
      if (result.ok) {
        setPhoto(undefined);
        setNote("");
        if (fileInput.current) fileInput.current.value = "";
        setMessage({ kind: "ok", text: "Saved to drafts." });
      } else {
        setMessage({ kind: "error", text: result.error });
      }
    });
  }

  const canSubmit = !saving && !preparing && (photo || note.trim());

  return (
    <div className="flex flex-col gap-4">
      <label className={`relative flex ${photo ? "aspect-square" : "aspect-[3/2]"} cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-stone-300 bg-white text-stone-500`}>
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob preview
          <img src={photo.previewUrl} alt="Selected photo" className="h-full w-full object-cover" />
        ) : (
          <span>{preparing ? "Preparing photo…" : "Tap to add a photo for a polaroid"}</span>
        )}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => onPickPhoto(e.target.files?.[0])}
        />
      </label>
      {photo && (
        <button
          type="button"
          onClick={() => {
            setPhoto(undefined);
            if (fileInput.current) fileInput.current.value = "";
          }}
          className="-mt-2 self-end text-sm text-stone-500 underline"
        >
          Remove photo
        </button>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={500}
        rows={3}
        placeholder={photo ? "A quick note for later (optional)" : "…or just write a note"}
        className="rounded-lg border border-stone-300 bg-white px-3 py-2 text-base outline-none focus:border-stone-500"
      />

      <dl className="space-y-1 text-sm text-stone-600">
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-stone-400">Where</dt>
          <dd>
            {location ? (
              <>
                {location.lat.toFixed(5)}, {location.lng.toFixed(5)}{" "}
                <span className="text-stone-400">
                  ({location.source === "photo" ? "from photo" : `±${Math.round(location.accuracy)} m`})
                </span>
              </>
            ) : device.state === "locating" ? (
              "Locating…"
            ) : (
              <>
                {device.state === "unavailable" && device.reason} You can place it on the map when publishing.{" "}
                <button type="button" onClick={relocate} className="underline">
                  Retry
                </button>
              </>
            )}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-16 shrink-0 text-stone-400">When</dt>
          <dd>
            {photo?.meta.takenAt ? (
              <>
                {formatDateTime(photo.meta.takenAt)} <span className="text-stone-400">(from photo)</span>
              </>
            ) : (
              "Now"
            )}
          </dd>
        </div>
      </dl>

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="rounded-lg bg-stone-800 px-4 py-3 text-lg text-stone-50 disabled:opacity-50"
      >
        {saving ? "Saving…" : photo ? "Save polaroid" : "Save note"}
      </button>

      {message && (
        <p role="status" className={message.kind === "ok" ? "text-green-700" : "text-red-700"}>
          {message.text}
        </p>
      )}
    </div>
  );
}
