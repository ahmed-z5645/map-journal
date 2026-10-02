"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Entry, entryAspect, type EntryView } from "./entry";

/** Full-size entry over a dimmed backdrop. Esc or a backdrop click closes it. */
export function EntryModal({
  entry,
  editHref,
  onClose,
}: {
  entry: EntryView;
  editHref?: string;
  onClose: () => void;
}) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fit the card's height to ~76vh (its width follows its shape), capped by the viewport and a max size.
  const aspect = entryAspect(entry);
  const width = `min(92vw, ${(76 * aspect).toFixed(2)}vh, ${Math.round(aspect >= 1 ? 820 : 520)}px)`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={entry.kind === "polaroid" ? "Polaroid" : "Note"}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-stone-900/70 p-4 backdrop-blur-sm"
    >
      <Entry entry={entry} className="shrink-0" style={{ width }} />
      <div className="flex items-center gap-4 text-sm text-stone-100">
        {entry.kind === "polaroid" && <span className="text-stone-300">Tap the photo to turn it over</span>}
        {editHref && (
          <Link href={editHref} className="underline">
            Edit
          </Link>
        )}
        <button ref={closeButton} type="button" onClick={onClose} className="rounded-md bg-white/15 px-3 py-1">
          Close
        </button>
      </div>
    </div>
  );
}
