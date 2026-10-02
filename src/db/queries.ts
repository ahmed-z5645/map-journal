import "server-only";
import { asc, count, desc, eq } from "drizzle-orm";
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
  return getDb()
    .select({
      id: postcards.id,
      status: postcards.status,
      lat: postcards.lat,
      lng: postcards.lng,
      frontColor: postcards.frontColor,
      photoThumbKey: postcards.photoThumbKey,
      title: postcards.title,
      quickNote: postcards.quickNote,
      capturedAt: postcards.capturedAt,
    })
    .from(postcards)
    .orderBy(desc(postcards.capturedAt));
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
