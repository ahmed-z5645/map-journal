import { listPostcards } from "@/db/queries";
import { resolvePersonFilter } from "@/lib/person-filter";
import { toEntryViews } from "@/lib/entry-views";
import { presignedGetUrl } from "@/lib/r2";
import { isAdmin } from "@/lib/session";
import { Scrapbook } from "./scrapbook";

export default async function ScrapbookPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const { person } = await resolvePersonFilter((await searchParams).person);
  const rows = await listPostcards("published", person?.id);
  const [views, thumbs] = await Promise.all([
    toEntryViews(rows),
    Promise.all(rows.map((r) => (r.photoThumbKey ? presignedGetUrl(r.photoThumbKey) : null))),
  ]);
  return (
    <div className="cork min-h-full pb-28">
      <header className="mx-auto px-4 pt-10 pb-2 sm:px-6">
        <h1 className="text-4xl font-bold tracking-tight text-stone-900 drop-shadow-[0_1px_0_rgba(255,255,255,0.35)]">Scrapbook</h1>
        <p className="mt-1 font-type text-sm text-stone-800/80">
          {rows.length} {rows.length === 1 ? "entry" : "entries"}
          {person && <> with {person.name}</>}
        </p>
      </header>
      {rows.length === 0 ? (
        <p className="px-4 pt-6 font-medium text-stone-800/70 sm:px-6">Nothing in here yet.</p>
      ) : (
        <Scrapbook cards={rows.map((r, i) => ({ id: r.id, view: views[i], thumbUrl: thumbs[i] }))} canEdit={await isAdmin()} />
      )}
    </div>
  );
}
