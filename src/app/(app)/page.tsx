import { listMapCards } from "@/db/queries";
import { presignedGetUrl } from "@/lib/r2";
import { PostcardMap, type MapCard } from "./postcard-map";

export default async function MapPage() {
  const rows = await listMapCards();
  const cards: MapCard[] = await Promise.all(
    rows.map(async ({ photoThumbKey, capturedAt, ...c }) => ({
      ...c,
      capturedAt: capturedAt.toISOString(),
      thumbUrl: photoThumbKey ? await presignedGetUrl(photoThumbKey) : null,
    })),
  );
  return <PostcardMap cards={cards} />;
}
