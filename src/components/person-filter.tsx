"use client";

import { usePathname, useRouter } from "next/navigation";

type Person = { id: string; name: string; count: number };

/** "Everyone" or one person; writes ?person= so Map and Shoebox share it. */
export function PersonFilter({ people, selectedId, className = "" }: { people: Person[]; selectedId?: string; className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  if (people.length === 0) return null;

  return (
    <label className={`flex items-center gap-2 text-sm ${className}`}>
      <span className="text-stone-500">With</span>
      <select
        value={selectedId ?? ""}
        onChange={(e) => router.replace(e.target.value ? `${pathname}?person=${e.target.value}` : pathname, { scroll: false })}
        className="rounded-md border border-stone-300 bg-white py-1 pr-7 pl-2 shadow-sm"
      >
        <option value="">Everyone</option>
        {people.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.count})
          </option>
        ))}
      </select>
    </label>
  );
}
