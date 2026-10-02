"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Entry, entryAspect, type EntryKind } from "@/components/entry";
import { fromTorontoInput, toTorontoInput } from "@/lib/dates";
import { preparePhoto } from "@/lib/prepare-photo";
import { cropPhoto, deleteDraft, replacePhoto, saveCard } from "./actions";
import { CropDialog } from "./crop-dialog";
import { LocationPicker } from "./location-picker";
import { PeopleInput } from "./people-input";

export type EditableEntry = {
  id: string;
  kind: EntryKind;
  status: "draft" | "published";
  title: string | null;
  body: string | null;
  quickNote: string | null;
  placeLabel: string | null;
  lat: number | null;
  lng: number | null;
  capturedAt: string; // ISO
  people: string[];
  photoUrl: string | null;
  originalUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
};

type PhotoResult = { photoUrl: string; originalUrl: string; photoWidth: number; photoHeight: number };

const label = "mb-1 block text-sm font-medium text-stone-600";
const field = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 outline-none focus:border-stone-500";
const smallButton = "rounded-md border border-stone-300 bg-white px-3 py-1.5 text-sm";

export function Editor({ entry, knownPeople }: { entry: EditableEntry; knownPeople: string[] }) {
  const router = useRouter();
  const isPolaroid = entry.kind === "polaroid";
  const isDraft = entry.status === "draft";

  const [title, setTitle] = useState(entry.title ?? "");
  // Seed the writing with the quick note from capture, so it isn't lost.
  const [body, setBody] = useState(entry.body ?? entry.quickNote ?? "");
  const [placeLabel, setPlaceLabel] = useState(entry.placeLabel ?? "");
  const [location, setLocation] = useState(
    entry.lat !== null && entry.lng !== null ? { lat: entry.lat, lng: entry.lng } : null,
  );
  const [capturedAt, setCapturedAt] = useState(toTorontoInput(entry.capturedAt));
  const [people, setPeople] = useState(entry.people);
  const [photo, setPhoto] = useState(
    entry.photoUrl && entry.originalUrl
      ? { url: entry.photoUrl, originalUrl: entry.originalUrl, width: entry.photoWidth, height: entry.photoHeight }
      : null,
  );
  const [flipped, setFlipped] = useState(false);
  const [cropping, setCropping] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string }>();
  const [pending, startTransition] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  const capturedIso = capturedAt ? fromTorontoInput(capturedAt) : entry.capturedAt;
  const preview = {
    kind: entry.kind,
    photoUrl: photo?.url ?? null,
    photoWidth: photo?.width ?? null,
    photoHeight: photo?.height ?? null,
    title: isPolaroid ? title.trim() || null : null,
    body: body.trim() || null,
    people: isPolaroid ? people : [],
    placeLabel: placeLabel.trim() || null,
    capturedAt: capturedIso,
  };
  const canPublish = !!location && (isPolaroid || !!body.trim());

  function run(task: () => Promise<{ ok: true } | { ok: false; error: string }>, onOk: () => void) {
    setMessage(undefined);
    startTransition(async () => {
      const res = await task().catch(() => ({ ok: false as const, error: "Network error. Try again." }));
      if (res.ok) onOk();
      else setMessage({ kind: "error", text: res.error });
    });
  }

  function applyPhoto(res: PhotoResult) {
    setPhoto({ url: res.photoUrl, originalUrl: res.originalUrl, width: res.photoWidth, height: res.photoHeight });
  }

  function save(publish: boolean) {
    const input = {
      title: isPolaroid ? title : null,
      body,
      placeLabel,
      lat: location?.lat ?? null,
      lng: location?.lng ?? null,
      capturedAt: capturedIso,
      people: isPolaroid ? people : [],
    };
    run(
      () => saveCard(entry.id, input, publish),
      () => {
        if (publish) router.push(`/?card=${entry.id}`);
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
        const res = await replacePhoto(entry.id, fd);
        if (res.ok) applyPhoto(res);
        return res;
      },
      () => setMessage({ kind: "ok", text: "Photo saved." }),
    );
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-8 p-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      {/* Preview */}
      <div className="md:sticky md:top-4 md:self-start">
        <Entry
          entry={preview}
          flipped={flipped}
          onFlip={() => setFlipped((f) => !f)}
          className={`mx-auto w-full ${entryAspect(preview) > 1.05 ? "max-w-lg" : "max-w-sm"}`}
        />
        {isPolaroid && <p className="mt-3 text-center text-sm text-stone-500">Tap the polaroid to turn it over.</p>}
      </div>

      {/* Form */}
      <div className="flex flex-col gap-5">
        <h1 className="font-hand text-3xl">
          {isDraft ? (isPolaroid ? "Finish this polaroid" : "Finish this note") : isPolaroid ? "Edit polaroid" : "Edit note"}
        </h1>

        {isPolaroid && (
          <>
            <section>
              <span className={label}>Photo</span>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setCropping(true)} disabled={!photo} className={smallButton}>
                  Crop
                </button>
                <button type="button" onClick={() => fileInput.current?.click()} className={smallButton}>
                  Replace photo
                </button>
              </div>
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

            <label onFocus={() => setFlipped(false)}>
              <span className={label}>
                Title <span className="font-normal text-stone-400">(optional, written under the photo)</span>
              </span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} className={field} />
            </label>
          </>
        )}

        <label>
          <span className={label}>{isPolaroid ? "On the back" : "Note"}</span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={5000}
            rows={isPolaroid ? 6 : 10}
            className={`${field} font-hand text-xl leading-snug`}
            onFocus={() => setFlipped(true)}
          />
        </label>

        {isPolaroid && (
          <div>
            <span className={label}>People</span>
            <PeopleInput value={people} onChange={setPeople} known={knownPeople} />
          </div>
        )}

        <div>
          <span className={label}>Where</span>
          <LocationPicker kind={entry.kind} value={location} onChange={setLocation} />
          <div className="mt-2 flex gap-2">
            <input
              value={placeLabel}
              onChange={(e) => setPlaceLabel(e.target.value)}
              maxLength={120}
              placeholder="Place name (optional), e.g. Trinity Bellwoods"
              className={field}
            />
            {location && isDraft && (
              <button type="button" onClick={() => setLocation(null)} className="shrink-0 text-sm text-stone-500 underline">
                Clear pin
              </button>
            )}
          </div>
          {!location && <p className="mt-1 text-sm text-amber-700">Tap the map to place this {entry.kind}.</p>}
        </div>

        <label>
          <span className={label}>
            When <span className="font-normal text-stone-400">(Toronto time)</span>
          </span>
          <input type="datetime-local" value={capturedAt} onChange={(e) => setCapturedAt(e.target.value)} className={field} />
        </label>

        <div className="flex flex-wrap items-center gap-3 border-t border-stone-200 pt-5">
          {isDraft ? (
            <>
              <button
                type="button"
                disabled={pending || !canPublish}
                onClick={() => save(true)}
                className="rounded-lg bg-stone-800 px-4 py-2 text-stone-50 disabled:opacity-50"
                title={canPublish ? undefined : location ? "Write something first" : "Place it on the map first"}
              >
                Publish to map
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => save(false)}
                className="rounded-lg border border-stone-300 bg-white px-4 py-2 disabled:opacity-50"
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  if (!confirm(`Delete this draft${isPolaroid ? " and its photo" : ""}? This can't be undone.`)) return;
                  run(
                    () => deleteDraft(entry.id),
                    () => router.push("/drafts"),
                  );
                }}
                className="ml-auto text-sm text-red-700 underline disabled:opacity-50"
              >
                Delete draft
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={() => save(false)}
              className="rounded-lg bg-stone-800 px-4 py-2 text-stone-50 disabled:opacity-50"
            >
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
          busy={pending}
          onCancel={() => setCropping(false)}
          onApply={(crop) =>
            run(
              async () => {
                const res = await cropPhoto(entry.id, crop);
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
