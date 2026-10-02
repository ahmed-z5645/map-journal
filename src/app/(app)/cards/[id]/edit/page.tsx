import { notFound } from "next/navigation";
import { z } from "zod";
import { getCardWithPeople, listPeople } from "@/db/queries";
import { presignedGetUrl } from "@/lib/r2";
import { Editor } from "./editor";

export default async function EditCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();

  const [card, known] = await Promise.all([getCardWithPeople(id), listPeople()]);
  if (!card) notFound();

  const [photoUrl, originalUrl] = await Promise.all([
    card.photoFullKey ? presignedGetUrl(card.photoFullKey) : null,
    card.photoOriginalKey ? presignedGetUrl(card.photoOriginalKey) : null,
  ]);

  return (
    <Editor
      // Remount with fresh state if the entry changes underneath (e.g. after revalidation).
      key={card.updatedAt.toISOString()}
      knownPeople={known.map((p) => p.name)}
      entry={{
        id: card.id,
        kind: card.kind,
        status: card.status,
        title: card.title,
        body: card.body,
        quickNote: card.quickNote,
        placeLabel: card.placeLabel,
        lat: card.lat,
        lng: card.lng,
        capturedAt: card.capturedAt.toISOString(),
        people: card.people.map((p) => p.name),
        photoUrl,
        originalUrl,
        photoWidth: card.photoWidth,
        photoHeight: card.photoHeight,
      }}
    />
  );
}
