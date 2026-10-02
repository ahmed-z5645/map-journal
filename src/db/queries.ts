import "server-only";
import { count, desc, eq } from "drizzle-orm";
import { getDb } from ".";
import { postcards } from "./schema";

export async function countDrafts() {
  const [row] = await getDb().select({ n: count() }).from(postcards).where(eq(postcards.status, "draft"));
  return row?.n ?? 0;
}

export function listPostcards(status: "draft" | "published") {
  return getDb()
    .select()
    .from(postcards)
    .where(eq(postcards.status, status))
    .orderBy(desc(postcards.capturedAt));
}
