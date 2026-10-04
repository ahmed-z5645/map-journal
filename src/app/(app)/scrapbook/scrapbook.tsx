"use client";

import { useState } from "react";
import type { EntryView } from "@/components/entry";
import { EntryModal } from "@/components/entry-modal";
import { formatMonth } from "@/lib/dates";

type Card = { id: string; view: EntryView; thumbUrl: string | null };

/** A small, stable tilt per entry, as if pinned up by hand. */
function tilt(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return `${((Math.abs(h) % 61) - 30) / 10}deg`;
}

/** Shifts the shared wrinkle texture so each note card crumples differently. */
function wrinkles(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 33 + ch.charCodeAt(0)) | 0;
  const a = Math.abs(h);
  return { "--wrinkle-x": `${a % 320}px`, "--wrinkle-y": `${(a >> 9) % 320}px` } as React.CSSProperties;
}

/** Polaroids pinned to a corkboard in a grid, under month tags; tap one to view full size and swipe through. */
export function Scrapbook({ cards, canEdit }: { cards: Card[]; canEdit: boolean }) {
  const [openIndex, setOpenIndex] = useState<number>();
  const open = openIndex === undefined ? undefined : cards[openIndex];

  const months: { label: string; items: { card: Card; index: number }[] }[] = [];
  cards.forEach((card, index) => {
    const label = formatMonth(card.view.capturedAt);
    if (months.at(-1)?.label !== label) months.push({ label, items: [] });
    months.at(-1)!.items.push({ card, index });
  });

  return (
    <>
      <div className="flex flex-col gap-8">
        {months.map((month) => (
          <section key={month.label}>
            <h2 className="sticky top-3 z-20 mx-4 mb-4 inline-block rounded-full bg-white/75 px-4 py-1.5 font-type text-base font-bold text-stone-900 shadow-[0_4px_20px_rgba(0,0,0,0.15)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 sm:mx-6">
              {month.label}
            </h2>
            <ul className="grid grid-cols-3 gap-x-4 gap-y-6 px-4 pt-2 sm:grid-cols-4 sm:gap-x-7 sm:gap-y-9 sm:px-6 lg:grid-cols-6">
              {month.items.map(({ card, index }) => (
                <li key={card.id}>
                  <button
                    type="button"
                    onClick={() => setOpenIndex(index)}
                    aria-label={`Open ${card.view.title ?? (card.view.kind === "polaroid" ? "polaroid" : "note")}`}
                    className="block w-full transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-stone-900"
                    style={{ rotate: tilt(card.id) }}
                  >
                    <Tile card={card} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {open && openIndex !== undefined && (
        <EntryModal
          entry={open.view}
          editHref={canEdit ? `/cards/${open.id}/edit` : undefined}
          onClose={() => setOpenIndex(undefined)}
          onPrev={openIndex > 0 ? () => setOpenIndex(openIndex - 1) : undefined}
          onNext={openIndex < cards.length - 1 ? () => setOpenIndex(openIndex + 1) : undefined}
          position={`${openIndex + 1} of ${cards.length}`}
        />
      )}
    </>
  );
}

// Same frame as the full-size polaroid (even border, deeper strip below), but every photo cropped square
// so the grid lines up. Notes get the same footprint on ruled paper. Sizes are in cqw of the wrapper.
const FRAME = "block aspect-[0.897] w-full rounded-[1cqw] shadow-[0_2px_3px_rgba(40,20,0,0.25),0_8px_18px_rgba(40,20,0,0.25)]";

function Tile({ card }: { card: Card }) {
  return (
    <span className="@container relative block w-full">
      <TileFace card={card} />
      <Pin />
    </span>
  );
}

/** A red push pin through the top of the frame, with its shadow falling down and to the right. */
function Pin() {
  return (
    <span aria-hidden className="absolute -top-[3cqw] left-1/2 block h-[9cqw] w-[9cqw] -translate-x-1/2">
      <span className="absolute top-[3.5cqw] left-[3.5cqw] block h-[8cqw] w-[8cqw] rounded-full bg-black/30 blur-[1.5cqw]" />
      <span
        className="absolute inset-0 block rounded-full shadow-[inset_0_-0.8cqw_1.2cqw_rgba(0,0,0,0.35)]"
        style={{ background: "radial-gradient(circle at 35% 30%, #ff8a80 0%, #e53935 35%, #a31515 100%)" }}
      />
      <span className="absolute top-[1.6cqw] left-[2.2cqw] block h-[2.2cqw] w-[2.8cqw] rounded-full bg-white/70 blur-[0.3cqw]" />
    </span>
  );
}

function TileFace({ card: { id, view, thumbUrl } }: { card: Card }) {
  if (view.kind === "polaroid") {
    return (
      <span className={`${FRAME} flex flex-col bg-[#fbfaf6] px-[5.5cqw] pt-[5.5cqw]`}>
        <span className="block aspect-square w-full overflow-hidden bg-stone-700">
          {thumbUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
            <img src={thumbUrl} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
          )}
        </span>
        <span className="flex min-h-0 flex-1 items-center px-[1cqw]">
          {view.title && <span className="line-clamp-1 font-hand text-[9cqw] leading-none text-stone-700">{view.title}</span>}
        </span>
      </span>
    );
  }
  return (
    <span
      className={`${FRAME} creased relative overflow-hidden bg-[#fdfdf7] px-[9cqw] pt-[11cqw] text-left`}
      style={{
        ...wrinkles(id),
        backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 calc(12cqw - 1px), #c9d6e6 calc(12cqw - 1px) 12cqw)",
        backgroundPosition: "0 calc(11cqw + 1px)",
      }}
    >
      <span className="line-clamp-6 font-type text-[6.2cqw] leading-[12cqw] text-stone-700">{view.body}</span>
    </span>
  );
}
