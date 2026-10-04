"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { formatLongDate } from "@/lib/dates";
import { Entry, entryAspect, type EntryView } from "./entry";

const Chevron = ({ dir }: { dir: "prev" | "next" }) => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d={dir === "next" ? "m9 5 7 7-7 7" : "m15 5-7 7 7 7"} />
  </svg>
);

/**
 * Full-size entry over a dimmed backdrop. Esc or a backdrop click closes it.
 * With onPrev/onNext it steps through a set: side buttons, ← →, or a swipe.
 */
export function EntryModal({
  entry,
  editHref,
  onClose,
  onPrev,
  onNext,
  position,
}: {
  entry: EntryView;
  editHref?: string;
  onClose: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  position?: string; // e.g. "3 of 17"
}) {
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeButton.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  // A mostly-horizontal swipe steps through the set; vertical drags are left to scroll long notes.
  const swipeFrom = useRef<{ x: number; y: number }>(undefined);
  const onPointerDown = (e: React.PointerEvent) => (swipeFrom.current = { x: e.clientX, y: e.clientY });
  const onPointerUp = (e: React.PointerEvent) => {
    if (!swipeFrom.current) return;
    const dx = e.clientX - swipeFrom.current.x;
    const dy = e.clientY - swipeFrom.current.y;
    swipeFrom.current = undefined;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
    if (dx < 0) onNext?.();
    else onPrev?.();
  };

  // Fit the card's height to ~72vh (its width follows its shape), capped by the viewport and a max size.
  const aspect = entryAspect(entry);
  const width = `min(88vw, ${(72 * aspect).toFixed(2)}vh, ${Math.round(aspect >= 1 ? 820 : 520)}px)`;
  const caption = [formatLongDate(entry.capturedAt), entry.placeLabel].filter(Boolean).join(" · ");
  const sideButton =
    "absolute top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25 sm:flex";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={entry.kind === "polaroid" ? "Polaroid" : "Note"}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="fixed inset-0 z-50 flex touch-pan-y flex-col items-center justify-center gap-4 bg-stone-900/80 p-4 backdrop-blur-sm"
    >
      <div className="text-center font-type text-sm text-stone-200">
        <p className="font-bold">{caption}</p>
        {entry.people.length > 0 && <p className="text-stone-400">with {entry.people.join(", ")}</p>}
      </div>
      {/* key: a new entry starts face up */}
      <Entry key={entry.capturedAt} entry={entry} className="shrink-0" style={{ width }} />
      <div className="flex items-center gap-4 text-sm text-stone-100">
        {position && <span className="text-stone-400 tabular-nums">{position}</span>}
        {entry.kind === "polaroid" && <span className="text-stone-400">Tap the photo to turn it over</span>}
        {editHref && (
          <Link href={editHref} className="underline">
            Edit
          </Link>
        )}
        <button ref={closeButton} type="button" onClick={onClose} className="rounded-full bg-white/15 px-3.5 py-1">
          Close
        </button>
      </div>

      {onPrev && (
        <button type="button" onClick={onPrev} aria-label="Previous" className={`${sideButton} left-4`}>
          <Chevron dir="prev" />
        </button>
      )}
      {onNext && (
        <button type="button" onClick={onNext} aria-label="Next" className={`${sideButton} right-4`}>
          <Chevron dir="next" />
        </button>
      )}
    </div>
  );
}
