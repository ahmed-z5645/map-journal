import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

function createDb(): Db {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Local Postgres (offline dev) speaks plain TCP, not Neon's HTTP protocol.
  // The query-builder API is the same, so expose it under one type.
  if (["localhost", "127.0.0.1"].includes(new URL(url).hostname)) {
    return drizzleNodePg(url, { schema }) as unknown as Db;
  }
  return drizzle(neon(url), { schema });
}

let instance: Db | undefined;

/** Created on first use so builds don't need DATABASE_URL. */
export function getDb() {
  return (instance ??= createDb());
}
