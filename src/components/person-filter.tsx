"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Person = { id: string; name: string; count: number };

const PersonIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
  </svg>
);

const Check = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

/**
 * Person button for the app menu: "Everyone" or one person, chosen from a popover.
 * Writes ?person= so Map and Scrapbook share it.
 */
export function PersonFilter({ people }: { people: Person[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const selectedId = useSearchParams().get("person") ?? "";
  const selected = people.find((p) => p.id === selectedId);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on a tap outside or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => ref.current?.contains(e.target as Node) || setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (people.length === 0) return null;

  function choose(id: string) {
    setOpen(false);
    router.replace(id ? `${pathname}?person=${id}` : pathname, { scroll: false });
  }

  const options = [{ id: "", name: "Everyone", count: undefined as number | undefined }, ...people];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={selected ? `Showing ${selected.name}` : "Choose who to show"}
        className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${
          selected ? "bg-stone-900 text-white shadow-sm" : open ? "bg-black/5" : "hover:bg-black/5"
        }`}
      >
        <PersonIcon />
        {selected && <span className="hidden max-w-28 truncate sm:inline">{selected.name}</span>}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 bottom-full mb-3 max-h-[60dvh] w-56 overflow-y-auto rounded-2xl bg-white/80 p-1.5 text-sm text-stone-800 shadow-[0_8px_30px_rgba(0,0,0,0.15)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150"
        >
          {options.map((p) => {
            const active = p.id === (selected?.id ?? "");
            return (
              <button
                key={p.id || "everyone"}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => choose(p.id)}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left hover:bg-black/5 ${active ? "font-medium" : ""}`}
              >
                <span className="w-4 text-stone-900">{active && <Check />}</span>
                <span className="flex-1 truncate">{p.name}</span>
                {p.count !== undefined && <span className="text-xs text-stone-400">{p.count}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
