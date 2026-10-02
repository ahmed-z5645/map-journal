import { NextResponse, type NextRequest } from "next/server";
import { isValidSessionToken, SESSION_COOKIE } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  if (await isValidSessionToken(req.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = new URL("/login", req.url);
  const next = req.nextUrl.pathname + req.nextUrl.search;
  if (next !== "/") login.searchParams.set("next", next);
  return NextResponse.redirect(login);
}

export const config = {
  // Everything except the login page, PWA manifest/icons and Next internals.
  matcher: ["/((?!login|manifest.webmanifest|icon|apple-icon|favicon.ico|_next/static|_next/image).*)"],
};
