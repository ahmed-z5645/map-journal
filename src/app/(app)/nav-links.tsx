"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

/** Map/Shoebox links keep the current ?person= filter when switching views. */
export function ViewLinks() {
  const person = useSearchParams().get("person");
  const qs = person ? `?person=${encodeURIComponent(person)}` : "";
  return (
    <>
      <Link href={`/${qs}`}>Map</Link>
      <Link href={`/shoebox${qs}`}>Shoebox</Link>
    </>
  );
}
