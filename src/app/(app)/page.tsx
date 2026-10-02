import { listMapCards } from "@/db/queries";
import { toPostcardViews } from "@/lib/postcard-views";
import { presignedGetUrl } from "@/lib/r2";
import { PostcardMap, type MapCard } from "./postcard-map";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const { card: focusId } = await searchParams;
  const rows = await listMapCards();
  const views = await toPostcardViews(rows);
  const cards: MapCard[] = await Promise.all(
    rows.map(async (r, i) => ({
      id: r.id,
      status: r.status,
      lat: r.lat,
      lng: r.lng,
      frontColor: r.frontColor,
      title: r.title,
      quickNote: r.quickNote,
      capturedAt: r.capturedAt.toISOString(),
      thumbUrl: r.photoThumbKey ? await presignedGetUrl(r.photoThumbKey) : null,
      view: views[i],
    })),
  );
  return <PostcardMap cards={cards} focusId={focusId} />;
}
