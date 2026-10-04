import "server-only";
import { cookies } from "next/headers";
import { isValidSessionToken, SESSION_COOKIE } from "./auth";

/** Logged in = admin. Everyone else can only look at the Map and Shoebox. */
export async function isAdmin() {
  return isValidSessionToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** First line of every server action: actions are reachable from public pages, so check here, not just in middleware. */
export async function requireAdmin() {
  if (!(await isAdmin())) throw new Error("Not allowed");
}
