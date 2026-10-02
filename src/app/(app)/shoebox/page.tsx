import { listPostcards } from "@/db/queries";
import { toPostcardViews } from "@/lib/postcard-views";
import { Shoebox } from "./shoebox";

export default async function ShoeboxPage() {
  const rows = await listPostcards("published");
  const views = await toPostcardViews(rows);
  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl px-4 py-6">
        <h1 className="mb-6 font-hand text-4xl">Shoebox</h1>
        {rows.length === 0 ? (
          <p className="text-stone-500">No published postcards yet.</p>
        ) : (
          <Shoebox cards={rows.map((r, i) => ({ id: r.id, view: views[i] }))} />
        )}
      </div>
    </div>
  );
}
