import { listPostcards } from "@/db/queries";
import { resolvePersonFilter } from "@/lib/person-filter";
import { toEntryViews } from "@/lib/entry-views";
import { isAdmin } from "@/lib/session";
import { Shoebox } from "./shoebox";

export default async function ShoeboxPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const { person } = await resolvePersonFilter((await searchParams).person);
  const rows = await listPostcards("published", person?.id);
  const views = await toEntryViews(rows);
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-4 pt-6 pb-28">
        <h1 className="mb-6 font-hand text-4xl">
          Shoebox
          {person && <span className="ml-2 text-2xl text-stone-500">with {person.name}</span>}
        </h1>
        {rows.length === 0 ? (
          <p className="text-stone-500">Nothing in the shoebox yet.</p>
        ) : (
          <Shoebox cards={rows.map((r, i) => ({ id: r.id, view: views[i] }))} canEdit={await isAdmin()} />
        )}
      </div>
    </div>
  );
}
