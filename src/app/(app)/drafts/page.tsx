import Link from "next/link";
import { listPostcards } from "@/db/queries";
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
              <div
                className="h-16 w-24 shrink-0 overflow-hidden rounded bg-stone-200"
                style={!thumbs[i] && d.frontColor ? { background: d.frontColor } : undefined}
              >
                {thumbs[i] && (
                  // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
                  <img src={thumbs[i]} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 text-sm">
                <p className="truncate">{d.quickNote ?? <span className="text-stone-400">No note</span>}</p>
                <p className="text-stone-500">
                  {d.capturedAt.toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                </p>
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
