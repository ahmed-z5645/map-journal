"use client";

import { useState } from "react";
import { formatLongDate } from "@/lib/dates";
import { DEFAULT_FRONT_COLOR } from "@/lib/postcard";

export type PostcardView = {
  photoUrl: string | null;
  photoWidth: number | null;
  photoHeight: number | null;
  frontColor: string | null;
  title: string | null;
  body: string | null;
  people: string[];
  placeLabel: string | null;
  capturedAt: string; // ISO
};


/** Card follows the photo's orientation; colour fronts are landscape. */
export const isPortrait = (c: Pick<PostcardView, "photoUrl" | "photoWidth" | "photoHeight">) =>
  !!c.photoUrl && !!c.photoWidth && !!c.photoHeight && c.photoHeight > c.photoWidth;

/**
 * A two-sided postcard. Click (or the controlled `flipped` prop) turns it over.
 * Text is sized in container units so the card reads the same at any width.
 */
export function Postcard({
  card,
  flipped: controlled,
  onFlip,
  className = "",
  style,
}: {
  card: PostcardView;
  flipped?: boolean;
  onFlip?: () => void;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [own, setOwn] = useState(false);
  const flipped = controlled ?? own;
  const portrait = isPortrait(card);
  const hasPhoto = !!card.photoUrl;

  return (
    <button
      type="button"
      onClick={() => (onFlip ? onFlip() : setOwn((f) => !f))}
      aria-label={flipped ? "Show front of postcard" : "Show back of postcard"}
      className={`@container block perspective-[1600px] ${portrait ? "aspect-[2/3]" : "aspect-[3/2]"} ${className}`}
      style={style}
    >
      <div
        className={`relative h-full w-full transition-transform duration-700 transform-3d ${flipped ? "rotate-y-180" : ""}`}
      >
        {/* Front */}
        <div className="absolute inset-0 overflow-hidden rounded-[1.5cqw] bg-white p-[2.5cqw] shadow-lg backface-hidden">
          {hasPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
            <img
              src={card.photoUrl!}
              alt={card.title ?? ""}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full" style={{ background: card.frontColor ?? DEFAULT_FRONT_COLOR }} />
          )}
        </div>

        {/* Back */}
        <div
          className={`absolute inset-0 flex overflow-hidden rounded-[1.5cqw] bg-[#fdfbf6] p-[5cqw] text-left text-stone-700 shadow-lg backface-hidden rotate-y-180 ${
            portrait ? "flex-col gap-[4cqw]" : "flex-row gap-[4cqw]"
          }`}
        >
          <div
            className={`min-h-0 overflow-y-auto font-hand leading-[1.35] whitespace-pre-wrap ${
              portrait ? "flex-1 text-[6.5cqw]" : "flex-[3] text-[4.2cqw]"
            }`}
          >
            {card.body || <span className="text-stone-300">Nothing written yet…</span>}
          </div>
          <div
            className={`flex flex-col justify-end gap-[1.5cqw] border-stone-300 ${
              portrait ? "border-t pt-[4cqw] text-[4.2cqw]" : "flex-[2] border-l pl-[4cqw] text-[max(11px,2.6cqw)]"
            }`}
          >
            {!hasPhoto && card.title && (
              <p className={`font-hand leading-tight text-stone-800 ${portrait ? "text-[8cqw]" : "text-[5cqw]"}`}>
                {card.title}
              </p>
            )}
            {card.people.length > 0 && <p>with {card.people.join(", ")}</p>}
            {card.placeLabel && <p>{card.placeLabel}</p>}
            <p className="text-stone-500">{formatLongDate(card.capturedAt)}</p>
          </div>
        </div>
      </div>
    </button>
  );
}
