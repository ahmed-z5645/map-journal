import { listMapCards } from "@/db/queries";
import { resolvePersonFilter } from "@/lib/person-filter";
import { toEntryViews } from "@/lib/entry-views";
import { presignedGetUrl } from "@/lib/r2";
import { EntryMap, type MapCard } from "./entry-map";

export default async function MapPage({ searchParams }: { searchParams: Promise<{ card?: string; person?: string }> }) {
  const { card: focusId, person: personParam } = await searchParams;
  const { people, person } = await resolvePersonFilter(personParam);
  const rows = await listMapCards(person?.id);
  const views = await toEntryViews(rows);
  const cards: MapCard[] = await Promise.all(
    rows.map(async (r, i) => ({
      id: r.id,
      status: r.status,
      lat: r.lat,
      lng: r.lng,
      kind: r.kind,
      title: r.title,
      quickNote: r.quickNote,
      capturedAt: r.capturedAt.toISOString(),
      thumbUrl: r.photoThumbKey ? await presignedGetUrl(r.photoThumbKey) : null,
      view: views[i],
    })),
  );
  return <EntryMap cards={cards} focusId={focusId} people={people} person={person} />;
}
