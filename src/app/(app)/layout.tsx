import Link from "next/link";
import { countDrafts } from "@/db/queries";
import { logout } from "../login/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const drafts = await countDrafts();
  return (
    <div className="flex h-dvh flex-col">
      <nav className="flex items-center gap-3 border-b sm:gap-4 border-stone-200 px-4 py-2 text-sm">
        <Link href="/" className="hidden font-hand text-2xl sm:inline">Postcards</Link>
        <Link href="/">Map</Link>
        <Link href="/shoebox">Shoebox</Link>
        <Link href="/drafts" className="flex items-center gap-1">
          Drafts
          {drafts > 0 && (
            <span className="rounded-full bg-stone-800 px-1.5 text-xs text-stone-50">{drafts}</span>
          )}
        </Link>
        <Link href="/add" className="ml-auto rounded-md bg-stone-800 px-3 py-1 text-stone-50">+ Add</Link>
        <form action={logout}>
          <button className="text-stone-500 hover:text-stone-800">Log out</button>
        </form>
      </nav>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
