import { listPostcards } from "@/db/queries";

export default async function ShoeboxPage() {
  const cards = await listPostcards("published");
  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 font-hand text-3xl">Shoebox</h1>
      {cards.length === 0 ? (
        <p className="text-stone-500">No published postcards yet.</p>
      ) : (
        <ul className="space-y-2">
          {cards.map((c) => (
            <li key={c.id} className="rounded-md bg-white p-3 shadow-sm">
              {c.title ?? "Untitled"} · {c.capturedAt.toLocaleDateString("en-CA")}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
