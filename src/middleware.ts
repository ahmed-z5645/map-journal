import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

/** Anyone can look at the Map and Shoebox; everything else (adding, drafts, editing) needs the admin login. */
const isPublic = (path: string) => path === "/" || path === "/shoebox" || path.startsWith("/shoebox/");

export async function middleware(req: NextRequest) {
  if (isPublic(req.nextUrl.pathname)) return NextResponse.next();
  if (await isValidSessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = new URL("/login", req.url);
  const next = req.nextUrl.pathname + req.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the login page, PWA manifest/icons, the public MapLibre worker and Next internals.
  matcher: ["/((?!login|manifest.webmanifest|icon|apple-icon|favicon.ico|maplibre/|_next/static|_next/image).*)"],
};
