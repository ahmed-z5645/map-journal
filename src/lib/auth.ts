// Session helpers. Edge-safe (used by middleware) — no Node APIs here.
import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "pj_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year, so the home-screen app stays logged in

function secret() {
  const s = process.env.SESSION_SECRET;
  if (!s) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(s);
}

export async function createSessionToken() {
  return new SignJWT({ sub: "owner" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secret());
}

export async function isValidSessionToken(token: string | undefined) {
  if (!token) return false;
  try {
    await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
