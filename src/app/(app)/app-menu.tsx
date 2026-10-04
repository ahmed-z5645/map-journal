"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { PersonFilter } from "@/components/person-filter";
import { logout } from "../login/actions";

const icon = "h-5 w-5 shrink-0";
const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const MapIcon = () => (
  <svg viewBox="0 0 24 24" className={icon} {...stroke}>
    <path d="M9 4 3 6.5v13L9 17l6 2.5 6-2.5V4l-6 2.5L9 4Z" />
    <path d="M9 4v13M15 6.5v13" />
  </svg>
);
const BookIcon = () => (
  <svg viewBox="0 0 24 24" className={icon} {...stroke}>
    <path d="M12 6.5C10.3 5 7.8 4.5 4 4.5v14c3.8 0 6.3.5 8 2 1.7-1.5 4.2-2 8-2v-14c-3.8 0-6.3.5-8 2Z" />
    <path d="M12 6.5v14" />
  </svg>
);
const DraftIcon = () => (
  <svg viewBox="0 0 24 24" className={icon} {...stroke}>
    <path d="M14 3.5H7A1.5 1.5 0 0 0 5.5 5v14A1.5 1.5 0 0 0 7 20.5h10a1.5 1.5 0 0 0 1.5-1.5V8L14 3.5Z" />
    <path d="M14 3.5V8h4.5M9 13h6M9 16.5h4" />
  </svg>
);
const PlusIcon = () => (
  <svg viewBox="0 0 24 24" className={icon} {...stroke} strokeWidth={2.2}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
const LogoutIcon = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" {...stroke}>
    <path d="M14 4h4.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H14M10 16l-4-4 4-4M6 12h10" />
  </svg>
);

/**
 * Floating frosted menu in the bottom-right corner. Map/Scrapbook keep the current ?person= filter.
 * Visitors only get Map, Scrapbook and the person filter; Drafts, Add and Log out are for the admin
 * (who logs in at /login).
 */
export function AppMenu({
  admin,
  drafts,
  people,
}: {
  admin: boolean;
  drafts: number;
  people: { id: string; name: string; count: number }[];
}) {
  const pathname = usePathname();
  const person = useSearchParams().get("person");
  const qs = person ? `?person=${encodeURIComponent(person)}` : "";
  // Choosing a person only means something where entries are shown.
  const filterable = pathname === "/" || pathname.startsWith("/scrapbook");

  const items = [
    { href: `/${qs}`, label: "Map", active: pathname === "/", Icon: MapIcon },
    { href: `/scrapbook${qs}`, label: "Scrapbook", active: pathname.startsWith("/scrapbook"), Icon: BookIcon },
    ...(admin ? [{ href: "/drafts", label: "Drafts", active: pathname.startsWith("/drafts"), Icon: DraftIcon, badge: drafts }] : []),
  ];

  return (
    <nav
      aria-label="Main"
      className="fixed right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-40 flex items-center gap-1 rounded-full bg-white/70 p-1.5 text-sm text-stone-700 shadow-[0_8px_30px_rgba(0,0,0,0.12)] ring-1 ring-black/5 backdrop-blur-xl backdrop-saturate-150"
    >
      {items.map(({ href, label, active, Icon, badge }) => (
        <Link
          key={label}
          href={href}
          aria-label={label}
          aria-current={active ? "page" : undefined}
          className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 transition-colors ${
            active ? "bg-white text-stone-900 shadow-sm" : "hover:bg-black/5"
          }`}
        >
          <Icon />
          <span className="hidden sm:inline">{label}</span>
          {!!badge && (
            <span className="absolute top-0.5 right-0.5 min-w-4 rounded-full bg-red-500 px-1 text-center text-[10px] leading-4 font-semibold text-white sm:static sm:text-xs">
              {badge}
            </span>
          )}
        </Link>
      ))}
      {filterable && (
        <>
          <span aria-hidden className="mx-0.5 h-5 w-px bg-black/10" />
          <PersonFilter people={people} />
        </>
      )}
      {admin && (
        <>
          <Link
            href="/add"
            aria-label="Add"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-stone-900 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
          >
            <PlusIcon />
          </Link>
          <form action={logout}>
            <button
              aria-label="Log out"
              title="Log out"
              className="flex h-9 w-9 items-center justify-center rounded-full text-stone-500 hover:bg-black/5 hover:text-stone-800"
            >
              <LogoutIcon />
            </button>
          </form>
        </>
      )}
    </nav>
  );
}
