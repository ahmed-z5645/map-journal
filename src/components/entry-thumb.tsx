import type { EntryKind } from "./entry";

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
