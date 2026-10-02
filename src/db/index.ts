import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

function createDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  // Works for both Neon (use the "-pooler" connection string) and a local Postgres.
  // Kept small: serverless instances each get their own pool.
  return drizzle(new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000 }), { schema });
}

let instance: ReturnType<typeof createDb> | undefined;

/** Created on first use so builds don't need DATABASE_URL. */
export function getDb() {
  return (instance ??= createDb());
}
