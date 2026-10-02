import { listPostcards } from "@/db/queries";

export default async function DraftsPage() {
  const drafts = await listPostcards("draft");
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 font-hand text-3xl">Drafts ({drafts.length})</h1>
      {drafts.length === 0 ? (
        <p className="text-stone-500">Nothing waiting to be written up.</p>
      ) : (
        <ul className="space-y-2">
          {drafts.map((d) => (
            <li key={d.id} className="rounded-md bg-white p-3 shadow-sm">
              {d.quickNote ?? "No note"} · {d.capturedAt.toLocaleString("en-CA")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
