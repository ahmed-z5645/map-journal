"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/db";
import { postcards } from "@/db/schema";
import { processAndStorePhoto } from "@/lib/images";
import { deleteObjects } from "@/lib/r2";

const MAX_PHOTO_BYTES = 4 * 1024 * 1024;

const optionalNumber = (min: number, max: number) =>
  z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.number().min(min).max(max).optional());

const draftInput = z.object({
  note: z.string().trim().max(500).optional().transform((s) => s || undefined),
  lat: optionalNumber(-90, 90),
  lng: optionalNumber(-180, 180),
  accuracy: optionalNumber(0, 1_000_000),
  capturedAt: z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional()),
});

export type CreateDraftResult = { ok: true } | { ok: false; error: string };

export async function createDraft(formData: FormData): Promise<CreateDraftResult> {
  const parsed = draftInput.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Some of the details didn't look right." };
  const { note, lat, lng, accuracy, capturedAt } = parsed.data;

  const photo = formData.get("photo");
  const hasPhoto = photo instanceof File && photo.size > 0;
  if (!hasPhoto && !note) return { ok: false, error: "Add a photo or a note." };
  if (hasPhoto && photo.size > MAX_PHOTO_BYTES) return { ok: false, error: "Photo is too large." };
  // A location is only meaningful as a pair.
  const hasLocation = lat !== undefined && lng !== undefined;

  const id = crypto.randomUUID();
  let photoFields: Awaited<ReturnType<typeof processAndStorePhoto>> | undefined;
  try {
    if (hasPhoto) photoFields = await processAndStorePhoto(id, Buffer.from(await photo.arrayBuffer()));
  } catch (err) {
    console.error("createDraft: photo upload failed", err);
    return { ok: false, error: "Couldn't save the photo. Try again." };
  }

  try {
    await getDb()
      .insert(postcards)
      .values({
        id,
        status: "draft",
        // A photo makes a polaroid; text alone is a note, and that text is the note itself.
        kind: hasPhoto ? "polaroid" : "note",
        quickNote: note,
        body: hasPhoto ? undefined : note,
        lat: hasLocation ? lat : undefined,
        lng: hasLocation ? lng : undefined,
        locationAccuracyM: hasLocation ? accuracy : undefined,
        capturedAt: capturedAt ?? new Date(),
        ...photoFields,
      });
  } catch (err) {
    console.error("createDraft: insert failed", err);
    if (photoFields) {
      await deleteObjects([photoFields.photoOriginalKey, photoFields.photoFullKey, photoFields.photoThumbKey]).catch(
        () => {},
      );
    }
    return { ok: false, error: "Couldn't save the draft. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}
