"use server";

import { eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { people, postcardPeople, postcards } from "@/db/schema";
import { processAndStorePhoto, recropPhoto } from "@/lib/images";
import { deleteObjects, photoKeys, presignedGetUrl } from "@/lib/r2";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .nullable()
    .transform((s) => s || null);

const cardInput = z
  .object({
    title: optionalText(120),
    body: optionalText(5000),
    placeLabel: optionalText(120),
    lat: z.number().min(-90).max(90).nullable(),
    lng: z.number().min(-180).max(180).nullable(),
    capturedAt: z.iso.datetime({ offset: true }),
    people: z.array(z.string().trim().min(1).max(60)).max(30),
  })
  .refine((v) => (v.lat === null) === (v.lng === null), "lat and lng go together");

export type CardInput = z.input<typeof cardInput>;
type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const isId = (id: unknown): id is string => z.uuid().safeParse(id).success;
const MISSING = { ok: false as const, error: "That entry no longer exists." };

/** Case-insensitive dedupe that keeps the first spelling. */
function uniqueNames(names: string[]) {
  const seen = new Map<string, string>();
  for (const n of names) if (!seen.has(n.toLowerCase())) seen.set(n.toLowerCase(), n);
  return [...seen.values()];
}

/**
 * Saves every editable field and the people tags; `publish` also moves a draft onto the map.
 * Notes are text only, so any title or people sent for a note are dropped.
 */
export async function saveCard(id: string, input: CardInput, publish: boolean): Promise<Result> {
  if (!isId(id)) return MISSING;
  const parsed = cardInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Some of the details didn't look right." };
  const { people: names, capturedAt, ...fields } = parsed.data;

  if (publish && fields.lat === null) {
    return { ok: false, error: "Place it on the map before publishing." };
  }

  try {
    const outcome = await getDb().transaction(async (tx) => {
      const [existing] = await tx
        .select({ status: postcards.status, kind: postcards.kind })
        .from(postcards)
        .where(eq(postcards.id, id))
        .for("update");
      if (!existing) return "missing";
      if (existing.status === "published" && fields.lat === null) return "needs-location";
      const isNote = existing.kind === "note";
      const goingLive = publish || existing.status === "published";
      if (isNote && goingLive && !fields.body) return "needs-text";

      await tx
        .update(postcards)
        .set({
          ...fields,
          ...(isNote ? { title: null } : {}),
          capturedAt: new Date(capturedAt),
          ...(publish && existing.status === "draft" ? { status: "published", publishedAt: new Date() } : {}),
        })
        .where(eq(postcards.id, id));

      // People: create any new names (existing spelling wins), then replace this card's tags.
      const wanted = isNote ? [] : uniqueNames(names);
      await tx.delete(postcardPeople).where(eq(postcardPeople.postcardId, id));
      if (wanted.length > 0) {
        await tx
          .insert(people)
          .values(wanted.map((name) => ({ name })))
          .onConflictDoNothing();
        const ids = await tx
          .select({ id: people.id })
          .from(people)
          .where(inArray(sql`lower(${people.name})`, wanted.map((n) => n.toLowerCase())));
        await tx.insert(postcardPeople).values(ids.map((p) => ({ postcardId: id, personId: p.id })));
      }
      return "saved";
    });
    if (outcome === "missing") return MISSING;
    if (outcome === "needs-location") return { ok: false, error: "A published entry needs a spot on the map." };
    if (outcome === "needs-text") return { ok: false, error: "Write something before publishing this note." };
  } catch (err) {
    console.error("saveCard failed", err);
    return { ok: false, error: "Couldn't save. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

/** Permanently deletes a draft and its photos. Published cards can't be deleted here. */
export async function deleteDraft(id: string): Promise<Result> {
  if (!isId(id)) return MISSING;
  const [deleted] = await getDb()
    .delete(postcards)
    .where(sql`${postcards.id} = ${id} and ${postcards.status} = 'draft'`)
    .returning({ id: postcards.id, hadPhoto: postcards.photoOriginalKey });
  if (!deleted) return { ok: false, error: "Only drafts can be deleted." };
  if (deleted.hadPhoto) {
    const k = photoKeys(id);
    await deleteObjects([k.original, k.full, k.thumb]).catch((err) => console.error("deleteDraft: R2 cleanup", err));
  }
  revalidatePath("/", "layout");
  return { ok: true };
}

type PhotoResult = Result<{ photoUrl: string; originalUrl: string; photoWidth: number; photoHeight: number }>;

async function photoResult(fullKey: string, originalKey: string, width: number, height: number): Promise<PhotoResult> {
  revalidatePath("/", "layout");
  const [photoUrl, originalUrl] = await Promise.all([presignedGetUrl(fullKey), presignedGetUrl(originalKey)]);
  return { ok: true, photoUrl, originalUrl, photoWidth: width, photoHeight: height };
}

export async function replacePhoto(id: string, formData: FormData): Promise<PhotoResult> {
  if (!isId(id)) return MISSING;
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0) return { ok: false, error: "No photo received." };
  if (photo.size > MAX_PHOTO_BYTES) return { ok: false, error: "Photo is too large." };

  const [entry] = await getDb().select({ kind: postcards.kind }).from(postcards).where(eq(postcards.id, id));
  if (!entry) return MISSING;
  if (entry.kind !== "polaroid") return { ok: false, error: "Notes don't have photos." };

  try {
    const stored = await processAndStorePhoto(id, Buffer.from(await photo.arrayBuffer()));
    const updated = await getDb()
      .update(postcards)
      .set(stored)
      .where(eq(postcards.id, id))
      .returning({ id: postcards.id });
    if (updated.length === 0) {
      await deleteObjects([stored.photoOriginalKey, stored.photoFullKey, stored.photoThumbKey]).catch(() => {});
      return MISSING;
    }
    return photoResult(stored.photoFullKey, stored.photoOriginalKey, stored.photoWidth, stored.photoHeight);
  } catch (err) {
    console.error("replacePhoto failed", err);
    return { ok: false, error: "Couldn't save the photo. Try again." };
  }
}

const cropInput = z
  .object({
    x: z.number().min(0).max(1),
    y: z.number().min(0).max(1),
    width: z.number().gt(0).max(1),
    height: z.number().gt(0).max(1),
  })
  .refine((c) => c.x + c.width <= 1.001 && c.y + c.height <= 1.001, "crop must stay inside the photo")
  .nullable();

/** Crops the polaroid's photo from its stored original; `null` goes back to the whole photo. */
export async function cropPhoto(id: string, crop: z.input<typeof cropInput>): Promise<PhotoResult> {
  if (!isId(id)) return MISSING;
  const parsed = cropInput.safeParse(crop);
  if (!parsed.success) return { ok: false, error: "That crop didn't look right." };

  const [card] = await getDb()
    .select({ originalKey: postcards.photoOriginalKey })
    .from(postcards)
    .where(eq(postcards.id, id));
  if (!card?.originalKey) return { ok: false, error: "This entry has no photo to crop." };

  try {
    const derived = await recropPhoto(id, card.originalKey, parsed.data);
    await getDb()
      .update(postcards)
      .set({ photoWidth: derived.photoWidth, photoHeight: derived.photoHeight })
      .where(eq(postcards.id, id));
    return photoResult(derived.photoFullKey, card.originalKey, derived.photoWidth, derived.photoHeight);
  } catch (err) {
    console.error("cropPhoto failed", err);
    return { ok: false, error: "Couldn't crop the photo. Try again." };
  }
}
