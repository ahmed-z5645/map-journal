"use client";

import Link from "next/link";
import { isPortrait, Postcard, type PostcardView } from "@/components/postcard";
import { formatMonth } from "@/lib/dates";

type Card = { id: string; view: PostcardView };

/** A small, stable tilt per card (−1.5°…1.5°) so the stack feels hand-placed. */
function tilt(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  return ((Math.abs(h) % 31) - 15) / 10;
}

/** Newest first, grouped under month headings. */
export function Shoebox({ cards }: { cards: Card[] }) {
  const months: { label: string; cards: Card[] }[] = [];
  for (const card of cards) {
    const label = formatMonth(card.view.capturedAt);
    if (months.at(-1)?.label !== label) months.push({ label, cards: [] });
    months.at(-1)!.cards.push(card);
  }

  return (
    <div className="flex flex-col gap-10">
      {months.map((month) => (
        <section key={month.label}>
          <h2 className="sticky top-0 z-10 -mx-4 mb-4 bg-paper/90 px-4 py-2 text-sm font-medium tracking-wide text-stone-500 uppercase backdrop-blur-sm">
            {month.label}
          </h2>
          <ul className="flex flex-col gap-10">
            {month.cards.map(({ id, view }) => (
              <li key={id} className="flex flex-col items-center gap-2">
                <div className={`w-full ${isPortrait(view) ? "max-w-xs" : ""}`} style={{ rotate: `${tilt(id)}deg` }}>
                  <Postcard card={view} className="w-full" />
                </div>
                <Link href={`/cards/${id}/edit`} className="text-xs text-stone-400 underline hover:text-stone-700">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
