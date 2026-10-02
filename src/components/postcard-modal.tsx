"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { isPortrait, Postcard, type PostcardView } from "./postcard";

/** Full-size postcard over a dimmed backdrop. Esc or a backdrop click closes it. */
export function PostcardModal({
  card,
  editHref,
  onClose,
}: {
  card: PostcardView;
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

  // Fit the card to the viewport: width-limited for landscape, height-limited for portrait.
  const width = isPortrait(card) ? "min(85vw, 52vh)" : "min(92vw, 900px, 115vh)";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Postcard"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-stone-900/70 p-4 backdrop-blur-sm"
    >
      <Postcard card={card} className="shrink-0" style={{ width }} />
      <div className="flex items-center gap-4 text-sm text-stone-100">
        <span className="text-stone-300">Tap the card to turn it over</span>
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
