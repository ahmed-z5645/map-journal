import "server-only";
import type { EntryView } from "@/components/entry";
import { peopleByCard } from "@/db/queries";
import type { Postcard } from "@/db/schema";
import { presignedGetUrl } from "./r2";

/** Builds what the Entry component renders: signed photo URL plus tagged people. */
export async function toEntryViews(rows: Postcard[]): Promise<EntryView[]> {
  const people = await peopleByCard(rows.map((r) => r.id));
  return Promise.all(
    rows.map(async (r) => ({
      kind: r.kind,
      photoUrl: r.photoFullKey ? await presignedGetUrl(r.photoFullKey) : null,
      photoWidth: r.photoWidth,
      photoHeight: r.photoHeight,
      title: r.title,
      body: r.body,
      people: people.get(r.id) ?? [],
      placeLabel: r.placeLabel,
      capturedAt: r.capturedAt.toISOString(),
    })),
  );
}
