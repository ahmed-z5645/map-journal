"use client";

import { useCallback, useEffect, useState } from "react";

const SEEN_KEY = "map-journal:seen";

function readSeen(): Set<string> {
  try {
    const ids: unknown = JSON.parse(localStorage.getItem(SEEN_KEY) ?? "[]");
    return new Set(Array.isArray(ids) ? ids.filter((id) => typeof id === "string") : []);
  } catch {
    return new Set();
  }
}

/**
 * Which entries this browser has opened, kept in localStorage (so it's per device, and
 * starts over if site data is cleared). `seen` is undefined until it's been read, to avoid
 * a hydration mismatch.
 */
export function useSeen() {
  const [seen, setSeen] = useState<Set<string>>();
  useEffect(() => setSeen(readSeen()), []);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (!prev || prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      try {
        localStorage.setItem(SEEN_KEY, JSON.stringify([...next]));
      } catch {
        // Storage blocked (e.g. private mode): progress just won't survive a reload.
      }
      return next;
    });
  }, []);

  return { seen, markSeen };
}

/** "5 of 17 seen" with a slim bar; frosted to match the app menu. */
export function SeenProgress({ seen, total, className = "" }: { seen: number; total: number; className?: string }) {
  if (total === 0) return null;
  const done = seen >= total;
  return (
    <div
      role="progressbar"
      aria-label="Entries seen"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={seen}
      className={`flex items-center gap-2.5 rounded-full bg-white/70 px-3.5 py-2 text-xs text-stone-600 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150 ${className}`}
    >
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-black/10">
        <div
          className={`h-full rounded-full transition-[width] duration-500 ${done ? "bg-emerald-500" : "bg-stone-800"}`}
          style={{ width: `${(Math.min(seen, total) / total) * 100}%` }}
        />
      </div>
      <span className="tabular-nums">{done ? "Seen everything" : `${seen} of ${total} seen`}</span>
    </div>
  );
}
