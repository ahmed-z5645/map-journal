"use client";

import Link from "next/link";
import { Entry, type EntryView } from "@/components/entry";
import { formatMonth } from "@/lib/dates";

type Card = { id: string; view: EntryView };

/** A small, stable tilt and sideways nudge per entry so the box feels hand-filled. */
function scatter(id: string) {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  const a = Math.abs(h);
  return { rotate: `${((a % 51) - 25) / 10}deg`, translate: `${((a >> 6) % 41) - 20}px 0` };
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
                <div className="w-full max-w-xs" style={scatter(id)}>
                  <Entry entry={view} className="w-full" />
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
