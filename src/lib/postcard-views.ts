import "server-only";
import type { PostcardView } from "@/components/postcard";
import { peopleByCard } from "@/db/queries";
import type { Postcard } from "@/db/schema";
import { presignedGetUrl } from "./r2";

/** Builds what the Postcard component renders: signed photo URL plus tagged people. */
export async function toPostcardViews(rows: Postcard[]): Promise<PostcardView[]> {
  const people = await peopleByCard(rows.map((r) => r.id));
  return Promise.all(
    rows.map(async (r) => ({
      photoUrl: r.photoFullKey ? await presignedGetUrl(r.photoFullKey) : null,
      photoWidth: r.photoWidth,
      photoHeight: r.photoHeight,
      frontColor: r.frontColor,
      title: r.title,
      body: r.body,
      people: people.get(r.id) ?? [],
      placeLabel: r.placeLabel,
      capturedAt: r.capturedAt.toISOString(),
    })),
  );
}
