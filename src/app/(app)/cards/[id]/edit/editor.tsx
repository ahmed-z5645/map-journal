"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { isPortrait, Postcard } from "@/components/postcard";
import { fromTorontoInput, toTorontoInput } from "@/lib/dates";
import { DEFAULT_FRONT_COLOR } from "@/lib/postcard";
import { preparePhoto } from "@/lib/prepare-photo";
import { cropPhoto, deleteDraft, removePhoto, replacePhoto, saveCard } from "./actions";
import { CropDialog } from "./crop-dialog";
import { LocationPicker } from "./location-picker";
import { PeopleInput } from "./people-input";

export type EditableCard = {
  id: string;
  status: "draft" | "published";
  title: string | null;
  body: string | null;
  quickNote: string | null;
  placeLabel: string | null;
  frontColor: string | null;
  lat: number | null;
  lng: number | null;
  capturedAt: string; // ISO
  people: string[];
  photoUrl: string | null;
  originalUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
};

const SWATCHES = ["#c8553d", "#2f6f8f", "#588157", "#e9c46a", "#6d597a", "#264653"];

const label = "mb-1 block text-sm font-medium text-stone-600";
const field = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-stone-500";

export function Editor({ card, knownPeople }: { card: EditableCard; knownPeople: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(card.title ?? "");
  // Seed the back with the quick note from capture, so it isn't lost.
  const [body, setBody] = useState(card.body ?? card.quickNote ?? "");
  const [placeLabel, setPlaceLabel] = useState(card.placeLabel ?? "");
  const [frontColor, setFrontColor] = useState(card.frontColor ?? DEFAULT_FRONT_COLOR);
  const [location, setLocation] = useState(card.lat !== null && card.lng !== null ? { lat: card.lat, lng: card.lng } : null);
  const [capturedAt, setCapturedAt] = useState(toTorontoInput(card.capturedAt));
  const [people, setPeople] = useState(card.people);
  const [photo, setPhoto] = useState(
    card.photoUrl
      ? { url: card.photoUrl, originalUrl: card.originalUrl!, width: card.photoWidth, height: card.photoHeight }
      : null,
  );
  const [flipped, setFlipped] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string }>();
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const isDraft = card.status === "draft";
  const capturedIso = capturedAt ? fromTorontoInput(capturedAt) : card.capturedAt;
  const preview = {
    photoUrl: photo?.url ?? null,
    photoWidth: photo?.width ?? null,
    photoHeight: photo?.height ?? null,
    frontColor,
    title: title.trim() || null,
    body: body.trim() || null,
    people,
    placeLabel: placeLabel.trim() || null,
    capturedAt: capturedIso,
  };

  function run(task: () => Promise<{ ok: true } | { ok: false; error: string }>, onOk: () => void) {
    setMessage(undefined);
    startTransition(async () => {
      const res = await task().catch(() => ({ ok: false as const, error: "Network error. Try again." }));
      if (res.ok) onOk();
      else setMessage({ kind: "error", text: res.error });
    });
  }

  function save(publish: boolean) {
    const input = {
      title,
      body,
      placeLabel,
      // A colour only matters without a photo, but keep the choice for if the photo is removed.
      frontColor,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      capturedAt: capturedIso,
      people,
    };
    run(
      () => saveCard(card.id, input, publish),
      () => {
        if (publish) router.push(`/?card=${card.id}`);
        else setMessage({ kind: "ok", text: "Saved." });
      },
    );
  }

  async function onPickPhoto(file: File | undefined) {
    if (!file) return;
    let blob: Blob;
    try {
      ({ blob } = await preparePhoto(file));
    } catch {
      setMessage({ kind: "error", text: "Couldn't read that photo." });
      return;
    }
    const fd = new FormData();
    fd.set("photo", blob, "photo.jpg");
    run(
      async () => {
        const res = await replacePhoto(card.id, fd);
        if (res.ok) applyPhoto(res);
        return res;
      },
      () => setMessage({ kind: "ok", text: "Photo saved." }),
    );
  }

  function applyPhoto(res: { photoUrl: string; originalUrl: string; photoWidth: number; photoHeight: number }) {
    setPhoto({ url: res.photoUrl, originalUrl: res.originalUrl, width: res.photoWidth, height: res.photoHeight });
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Preview */}
      <div className="md:sticky md:top-4 md:self-start">
        <Postcard
          card={preview}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          className={`mx-auto w-full ${isPortrait(preview) ? "max-w-xs" : ""}`}
        />
        <p className="mt-3 text-center text-sm text-stone-500">Tap the card to turn it over.</p>
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5">
        <h1 className="font-hand text-3xl">{isDraft ? "Finish this postcard" : "Edit postcard"}</h1>

        <section>
          <span className={label}>Front</span>
          {photo ? (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCropping(true)} className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm">
                Crop
              </button>
              <button type="button" onClick={() => fileInput.current?.click()} className="rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm">
                Replace photo
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!confirm("Remove the photo? The front will become a solid colour.")) return;
                  run(
                    () => removePhoto(card.id),
                    () => setPhoto(null),
                  );
                }}
                className="rounded-md px-3 py-1.5 text-sm text-stone-500 underline"
              >
                Use a colour instead
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setFrontColor(c)}
                  aria-label={`Colour ${c}`}
                  className={`h-8 w-8 rounded-full border-2 ${frontColor === c ? "border-stone-800" : "border-white"} shadow`}
                  style={{ background: c }}
                />
              ))}
              <input
                type="color"
                value={frontColor}
                onChange={(e) => setFrontColor(e.target.value)}
                aria-label="Custom colour"
                className="h-8 w-10 cursor-pointer rounded border border-stone-300"
              />
              <button type="button" onClick={() => fileInput.current?.click()} className="ml-auto rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm">
                Add a photo
              </button>
            </div>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(e) => {
              void onPickPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </section>

        <label>
          <span className={label}>
            Title <span className="font-normal text-stone-400">{photo ? "(not shown — the photo is the title)" : "(shown on the back)"}</span>
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className={field} />
        </label>

        <label>
          <span className={label}>Back of the card</span>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} rows={7} className={`${field} font-hand text-xl leading-snug`} onFocus={() => setFlipped(true)} />
        </label>

        <div>
          <span className={label}>People</span>
          <PeopleInput value={people} onChange={setPeople} known={knownPeople} />
        </div>

        <div>
          <span className={label}>Where</span>
          <LocationPicker value={location} onChange={setLocation} />
          <div className="mt-2 flex gap-2">
            <input value={placeLabel} onChange={(e) => setPlaceLabel(e.target.value)} maxLength={120} placeholder="Place name (optional), e.g. Trinity Bellwoods" className={field} />
            {location && isDraft && (
              <button type="button" onClick={() => setLocation(null)} className="shrink-0 text-sm text-stone-500 underline">
                Clear pin
              </button>
            )}
          </div>
          {!location && <p className="mt-1 text-sm text-amber-700">Tap the map to place this card.</p>}
        </div>

        <label>
          <span className={label}>When <span className="font-normal text-stone-400">(Toronto time)</span></span>
          <input type="datetime-local" value={capturedAt} onChange={(e) => setCapturedAt(e.target.value)} className={field} />
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
          {isDraft ? (
            <>
              <button type="button" disabled={pending || !location} onClick={() => save(true)} className="rounded-lg bg-stone-800 px-4 py-2 text-stone-50 disabled:opacity-50" title={location ? undefined : "Place it on the map first"}>
                Publish to map
              </button>
              <button type="button" disabled={pending} onClick={() => save(false)} className="rounded-lg border border-stone-300 bg-white px-4 py-2 disabled:opacity-50">
                Save draft
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm("Delete this draft and its photo? This can't be undone.")) return;
                  run(
                    () => deleteDraft(card.id),
                    () => router.push("/drafts"),
                  );
                }}
                className="ml-auto text-sm text-red-700 underline disabled:opacity-50"
              >
                Delete draft
              </button>
            </>
          ) : (
            <button type="button" disabled={pending} onClick={() => save(false)} className="rounded-lg bg-stone-800 px-4 py-2 text-stone-50 disabled:opacity-50">
              Save changes
            </button>
          )}
          {pending && <span className="text-sm text-stone-500">Working…</span>}
          {message && (
            <p role="status" className={`w-full text-sm ${message.kind === "ok" ? "text-green-700" : "text-red-700"}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>

      {cropping && photo && (
        <CropDialog
          imageUrl={photo.originalUrl}
          initialAspect={photo.width && photo.height && photo.height > photo.width ? 2 / 3 : 3 / 2}
          busy={pending}
          onCancel={() => setCropping(false)}
          onApply={(crop) =>
            run(
              async () => {
                const res = await cropPhoto(card.id, crop);
                if (res.ok) applyPhoto(res);
                return res;
              },
              () => setCropping(false),
            )
          }
        />
      )}
    </div>
  );
}
