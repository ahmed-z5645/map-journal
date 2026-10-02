"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { postcards } from "@/db/schema";

const moveInput = z
  .object({
    id: z.uuid(),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
  })
  .refine((v) => (v.lat === null) === (v.lng === null), "lat and lng go together");

/**
 * Sets a card's real location from a manual drag/placement on the map.
 * null clears it (undoing a draft's first placement); the DB check
 * constraint stops a published card from losing its location.
 */
export async function moveCard(input: { id: string; lat: number | null; lng: number | null }) {
  const parsed = moveInput.safeParse(input);
  if (!parsed.success) return { ok: false as const };
  const { id, lat, lng } = parsed.data;

  let updated;
  try {
    updated = await getDb()
      .update(postcards)
      // Hand-placed, so the GPS accuracy no longer applies.
      .set({ lat, lng, locationAccuracyM: null })
      .where(eq(postcards.id, id))
      .returning({ id: postcards.id });
  } catch (err) {
    console.error("moveCard failed", err);
    return { ok: false as const };
  }

  if (updated.length === 0) return { ok: false as const };
  revalidatePath("/", "layout");
  return { ok: true as const };
}
