import { PersonFilter } from "@/components/person-filter";
import { listPostcards } from "@/db/queries";
import { resolvePersonFilter } from "@/lib/person-filter";
import { toPostcardViews } from "@/lib/postcard-views";
import { Shoebox } from "./shoebox";

export default async function ShoeboxPage({ searchParams }: { searchParams: Promise<{ person?: string }> }) {
  const { people, person } = await resolvePersonFilter((await searchParams).person);
  const rows = await listPostcards("published", person?.id);
  const views = await toPostcardViews(rows);
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <h1 className="font-hand text-4xl">Shoebox</h1>
          <PersonFilter people={people} selectedId={person?.id} />
        </div>
        {rows.length === 0 ? (
          <p className="text-stone-500">No published postcards yet.</p>
        ) : (
          <Shoebox cards={rows.map((r, i) => ({ id: r.id, view: views[i] }))} />
        )}
      </div>
    </div>
  );
}
