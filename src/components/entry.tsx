"use client";

import { useState } from "react";
import { formatLongDate } from "@/lib/dates";

export type EntryKind = "polaroid" | "note";

export type EntryView = {
  kind: EntryKind;
  photoUrl: string | null; // polaroids only
  title: string | null; // polaroids only, written under the photo
  body: string | null;
  people: string[];
  placeLabel: string | null;
  capturedAt: string; // ISO
};

/** Width / height of each kind, for sizing containers. */
export const ENTRY_ASPECT: Record<EntryKind, number> = { polaroid: 88 / 107, note: 3 / 4 };

/** Small seeded PRNG so each note's torn edge is unique but stable across renders. */
function seeded(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h >>>= 0) % 1000) / 1000;
  };
}

function tornTopEdge(seed: string) {
  const rand = seeded(seed);
  const points = ["0% 100%", "100% 100%"];
  for (let x = 100; x >= 0; x -= 2.5) points.push(`${x}% ${(0.4 + rand() * 2.6).toFixed(2)}%`);
  return `polygon(${points.join(", ")})`;
}

/** A polaroid: square photo, handwritten title on the strip below; click to turn it over. */
export function Polaroid({
  entry,
  flipped: controlled,
  onFlip,
  className = "",
  style,
}: {
  entry: EntryView;
  flipped?: boolean;
  onFlip?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [own, setOwn] = useState(false);
  const flipped = controlled ?? own;

  return (
    <button
      type="button"
      onClick={() => (onFlip ? onFlip() : setOwn((f) => !f))}
      aria-label={flipped ? "Show front of polaroid" : "Show back of polaroid"}
      className={`@container block aspect-[88/107] perspective-[1600px] ${className}`}
      style={style}
    >
      <div className={`relative h-full w-full transition-transform duration-700 transform-3d ${flipped ? "rotate-y-180" : ""}`}>
        {/* Front */}
        <div className="absolute inset-0 flex flex-col rounded-[1cqw] bg-[#fbfaf6] px-[5.5cqw] pt-[5.5cqw] shadow-lg backface-hidden">
          <div className="aspect-square w-full overflow-hidden bg-stone-800 shadow-[inset_0_0_2cqw_rgba(0,0,0,0.25)]">
            {entry.photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
              <img
                src={entry.photoUrl}
                alt={entry.title ?? ""}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
            )}
          </div>
          <div className="flex min-h-0 flex-1 items-center px-[1cqw]">
            {entry.title && (
              <p className="line-clamp-2 font-hand text-[7.5cqw] leading-[1.05] text-stone-700">{entry.title}</p>
            )}
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 flex flex-col gap-[4cqw] rounded-[1cqw] bg-[#f4f2ec] p-[7cqw] text-left text-stone-700 shadow-lg backface-hidden rotate-y-180">
          <div className="min-h-0 flex-1 overflow-y-auto font-hand text-[6.5cqw] leading-[1.3] whitespace-pre-wrap">
            {entry.body || <span className="text-stone-300">Nothing written yet…</span>}
          </div>
          <div className="space-y-[1cqw] border-t border-stone-300 pt-[3cqw] text-[max(11px,3.6cqw)]">
            {entry.people.length > 0 && <p>with {entry.people.join(", ")}</p>}
            {entry.placeLabel && <p>{entry.placeLabel}</p>}
            <p className="text-stone-500">{formatLongDate(entry.capturedAt)}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

/**
 * A note: text on a torn-out, ruled notebook page. Single-sided.
 * The text box covers the whole page so the ruled lines (drawn on it, scrolling with the text)
 * and the red margin run edge to edge; lines sit 8cqw apart, just under each line of writing.
 */
export function NotePage({ entry, className = "", style }: { entry: EntryView; className?: string; style?: React.CSSProperties }) {
  return (
    // drop-shadow (not box-shadow) so the shadow follows the torn edge
    <div className={`@container aspect-[3/4] drop-shadow-[0_6px_10px_rgba(0,0,0,0.18)] ${className}`} style={style}>
      <div className="relative h-full w-full bg-[#fdfdf7]" style={{ clipPath: tornTopEdge(entry.capturedAt) }}>
        <div
          className="h-full overflow-y-auto pt-[11cqw] pr-[6cqw] pb-[14cqw] pl-[17cqw] text-left font-hand text-[6cqw] leading-[8cqw] whitespace-pre-wrap text-stone-800"
          style={{
            backgroundImage:
              "linear-gradient(to right, transparent 13cqw, #e7a3a3 13cqw, #e7a3a3 calc(13cqw + 1.5px), transparent calc(13cqw + 1.5px))," +
              "repeating-linear-gradient(to bottom, transparent 0 7cqw, #bccde3 7cqw calc(7cqw + 1.5px), transparent calc(7cqw + 1.5px) 8cqw)",
            // Offset the lines by the top padding so each one lands under a line of text.
            backgroundPosition: "0 0, 0 11cqw",
            backgroundAttachment: "local",
          }}
        >
          {entry.body || <span className="text-stone-300">Nothing written yet…</span>}
        </div>
        <p className="pointer-events-none absolute right-[6cqw] bottom-[4cqw] font-hand text-[max(13px,4.5cqw)] text-stone-500">
          {formatLongDate(entry.capturedAt)}
        </p>
      </div>
    </div>
  );
}

/** Renders either kind; `flipped`/`onFlip` only apply to polaroids. */
export function Entry(props: {
  entry: EntryView;
  flipped?: boolean;
  onFlip?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  return props.entry.kind === "polaroid" ? (
    <Polaroid {...props} />
  ) : (
    <NotePage entry={props.entry} className={props.className} style={props.style} />
  );
}
