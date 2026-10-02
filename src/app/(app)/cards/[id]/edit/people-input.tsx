"use client";

import { useId, useState } from "react";

/** Tag input: Enter or comma adds a name; suggestions come from people already tagged elsewhere. */
export function PeopleInput({
  value,
  onChange,
  known,
}: {
  value: string[];
  onChange: (names: string[]) => void;
  known: string[];
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();
  const has = (name: string) => value.some((v) => v.toLowerCase() === name.toLowerCase());

  function add(raw: string) {
    const name = raw.trim().replace(/,$/, "").trim();
    if (name) {
      // Reuse the existing spelling ("sam" → "Sam").
      const canonical = known.find((k) => k.toLowerCase() === name.toLowerCase()) ?? name;
      if (!has(canonical)) onChange([...value, canonical]);
    }
    setDraft("");
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-2 py-1.5 focus-within:border-stone-500">
      {value.map((name) => (
        <span key={name} className="flex items-center gap-1 rounded-full bg-stone-100 py-0.5 pr-1 pl-2.5 text-sm">
          {name}
          <button
            type="button"
            onClick={() => onChange(value.filter((v) => v !== name))}
            aria-label={`Remove ${name}`}
            className="rounded-full px-1 text-stone-400 hover:text-stone-800"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={draft}
        list={listId}
        onChange={(e) => {
          // Picking a datalist suggestion or typing a comma commits the name.
          const v = e.target.value;
          if (v.endsWith(",") || known.includes(v)) add(v);
          else setDraft(v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add(draft);
          } else if (e.key === "Backspace" && !draft && value.length > 0) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => add(draft)}
        placeholder={value.length ? "" : "Who was there?"}
        className="min-w-24 flex-1 bg-transparent py-0.5 outline-none"
      />
      <datalist id={listId}>
        {known.filter((k) => !has(k)).map((k) => (
          <option key={k} value={k} />
        ))}
      </datalist>
    </div>
  );
}
