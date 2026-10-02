import "server-only";
import { z } from "zod";
import { listPeopleWithCounts } from "@/db/queries";

export type FilterPerson = { id: string; name: string; count: number };

/**
 * Resolves ?person= against people who appear on published cards.
 * An unknown or malformed id is ignored rather than showing an empty view.
 */
export async function resolvePersonFilter(param: string | undefined) {
  const people: FilterPerson[] = await listPeopleWithCounts();
  const id = z.uuid().safeParse(param).success ? param : undefined;
  const person = people.find((p) => p.id === id);
  return { people, person };
}
