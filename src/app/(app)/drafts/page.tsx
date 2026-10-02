import Link from "next/link";
import { EntryThumb } from "@/components/entry-thumb";
import { listPostcards } from "@/db/queries";
import { formatDateTime } from "@/lib/dates";
import { presignedGetUrl } from "@/lib/r2";

export default async function DraftsPage() {
  const drafts = await listPostcards("draft");
  const thumbs = await Promise.all(drafts.map((d) => (d.photoThumbKey ? presignedGetUrl(d.photoThumbKey) : null)));

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 font-hand text-3xl">Drafts ({drafts.length})</h1>
      {drafts.length === 0 ? (
        <p className="text-stone-500">Nothing waiting to be written up.</p>
      ) : (
        <ul className="space-y-3">
          {drafts.map((d, i) => (
            <li key={d.id}>
              <Link href={`/cards/${d.id}/edit`} className="flex gap-3 rounded-md bg-white p-3 shadow-sm hover:shadow-md">
                <EntryThumb kind={d.kind} thumbUrl={thumbs[i]} className="h-16 w-16 shrink-0 rounded" />
                <div className="min-w-0 text-sm">
                  <p className="text-xs tracking-wide text-stone-400 uppercase">{d.kind}</p>
                  <p className="truncate">{d.quickNote ?? <span className="text-stone-400">No note</span>}</p>
                  <p className="text-stone-500">{formatDateTime(d.capturedAt)}</p>
                  {d.lat == null && <p className="text-amber-700">No location yet</p>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
