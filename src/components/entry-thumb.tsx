import type { EntryKind } from "./entry";

function hash(seed: string) {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

/** A stable tilt between -8° and 8° for each entry, so the map looks hand-placed. */
const tilt = (seed: string) => (hash(seed) % 17) - 8;

const tape = "absolute -top-1.5 left-1/2 h-3 w-7 -translate-x-1/2 bg-white/60 ring-1 ring-black/5 shadow-[0_1px_1px_rgba(0,0,0,0.08)]";

/** The main map's stand-in for an entry: a tiny taped-down polaroid (with its photo) or a scrap of ruled paper. */
export function MapSticker({
  id,
  kind,
  thumbUrl,
  caption,
  draft = false,
}: {
  id: string;
  kind: EntryKind;
  thumbUrl: string | null;
  caption: string | null; // notes only: the first few words, scribbled on the scrap
  draft?: boolean;
}) {
  const angle = tilt(id);
  const faded = draft ? "opacity-60 outline-1 outline-dashed outline-stone-500" : "";
  return (
    <div
      className={`relative transition-transform duration-150 hover:scale-125 hover:rotate-0! ${faded}`}
      style={{ rotate: `${angle}deg` }}
    >
      {kind === "polaroid" ? (
        <div className="w-12 bg-[#fbfaf6] p-1 pb-3 shadow-[0_3px_6px_rgba(0,0,0,0.25)]">
          {thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
            <img src={thumbUrl} alt="" draggable={false} className="aspect-square w-full object-cover" />
          ) : (
            <div className="aspect-square w-full bg-stone-700" />
          )}
        </div>
      ) : (
        <div
          className="flex h-12 w-10 items-start overflow-hidden bg-[#fdfdf7] px-1 pt-2 shadow-[0_3px_6px_rgba(0,0,0,0.2)]"
          style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 7px, #bccde3 7px 8px)", backgroundPosition: "0 1px" }}
        >
          {caption && <span className="line-clamp-4 font-hand text-[9px] leading-[8px] text-stone-700">{caption}</span>}
        </div>
      )}
      <div className={tape} style={{ rotate: `${-angle * 0.6}deg` }} />
    </div>
  );
}

/** Tiny stand-ins for an entry: map pins and list thumbnails. Same colours for every entry of a kind. */
export function EntryPin({ kind, draft = false }: { kind: EntryKind; draft?: boolean }) {
  const faded = draft ? "opacity-60 outline-1 outline-dashed outline-stone-500" : "";
  return kind === "polaroid" ? (
    <div className={`flex h-[19px] w-4 flex-col rounded-[1px] bg-white p-[2px] pb-[5px] shadow-md ring-1 ring-stone-300 ${faded}`}>
      <div className="flex-1 bg-stone-700" />
    </div>
  ) : (
    <div
      className={`h-[18px] w-[14px] bg-[#fdfdf7] shadow-md ring-1 ring-stone-300 ${faded}`}
      style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 3px, #9db4d3 3px 4px)", backgroundPosition: "0 4px" }}
    />
  );
}

/** List-sized thumbnail: the photo for a polaroid, a ruled scrap for a note. */
export function EntryThumb({ kind, thumbUrl, className = "" }: { kind: EntryKind; thumbUrl: string | null; className?: string }) {
  if (kind === "polaroid" && thumbUrl) {
    // eslint-disable-next-line @next/next/no-img-element -- presigned R2 URL
    return <img src={thumbUrl} alt="" className={`object-cover ${className}`} />;
  }
  return (
    <div
      className={`bg-[#fdfdf7] ring-1 ring-stone-200 ${className}`}
      style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0 7px, #bccde3 7px 8px)" }}
    />
  );
}
