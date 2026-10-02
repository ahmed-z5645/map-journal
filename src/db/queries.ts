import "server-only";
import { asc, count, desc, eq, inArray } from "drizzle-orm";
import { getDb } from ".";
import { people, postcardPeople, postcards } from "./schema";

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

/** Everything the map needs: published cards plus drafts (shown only in Arrange mode). */
export function listMapCards() {
  return getDb().select().from(postcards).orderBy(desc(postcards.capturedAt));
}

/** Tagged names per card, alphabetical. */
export async function peopleByCard(ids: string[]) {
  const byCard = new Map<string, string[]>();
  if (ids.length === 0) return byCard;
  const rows = await getDb()
    .select({ postcardId: postcardPeople.postcardId, name: people.name })
    .from(postcardPeople)
    .innerJoin(people, eq(people.id, postcardPeople.personId))
    .where(inArray(postcardPeople.postcardId, ids))
    .orderBy(asc(people.name));
  for (const r of rows) byCard.set(r.postcardId, [...(byCard.get(r.postcardId) ?? []), r.name]);
  return byCard;
}

export async function getCardWithPeople(id: string) {
  const db = getDb();
  const [card] = await db.select().from(postcards).where(eq(postcards.id, id));
  if (!card) return undefined;
  const tagged = await db
    .select({ id: people.id, name: people.name })
    .from(postcardPeople)
    .innerJoin(people, eq(people.id, postcardPeople.personId))
    .where(eq(postcardPeople.postcardId, id))
    .orderBy(asc(people.name));
  return { ...card, people: tagged };
}

export function listPeople() {
  return getDb().select({ id: people.id, name: people.name }).from(people).orderBy(asc(people.name));
}
