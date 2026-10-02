import sharp from "sharp";
import { getObjectBuffer, photoKeys, putObject } from "./r2";

const FULL_MAX = 2000;
const THUMB_MAX = 400;

/** Crop as fractions (0–1) of the original's width/height, so it's resolution-independent. */
export type Crop = { x: number; y: number; width: number; height: number };

/** Writes full + thumb WebP versions of `original` (optionally cropped). sharp drops EXIF by default. */
async function storeDerived(postcardId: string, original: Buffer, crop?: Crop) {
  const keys = photoKeys(postcardId);
  let base = sharp(original);
  if (crop) {
    const { width = 0, height = 0 } = await base.metadata();
    const left = Math.round(crop.x * width);
    const top = Math.round(crop.y * height);
    base = base.extract({
      left,
      top,
      width: Math.max(1, Math.min(width - left, Math.round(crop.width * width))),
      height: Math.max(1, Math.min(height - top, Math.round(crop.height * height))),
    });
  }

  const [full, thumb] = await Promise.all([
    base
      .clone()
      .resize(FULL_MAX, FULL_MAX, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true }),
    base
      .clone()
      .resize(THUMB_MAX, THUMB_MAX, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer(),
  ]);

  await Promise.all([putObject(keys.full, full.data, "image/webp"), putObject(keys.thumb, thumb, "image/webp")]);

  return {
    photoFullKey: keys.full,
    photoThumbKey: keys.thumb,
    photoWidth: full.info.width,
    photoHeight: full.info.height,
  };
}

/**
 * Stores the (client-compressed) original with orientation baked in, then derives full + thumb.
 * The original is kept uncropped so crops can be redone without quality loss.
 */
export async function processAndStorePhoto(postcardId: string, input: Buffer) {
  const keys = photoKeys(postcardId);
  // .rotate() applies EXIF orientation, so crop fractions match what the browser shows.
  const original = await sharp(input).rotate().jpeg({ quality: 90 }).toBuffer();
  await putObject(keys.original, original, "image/jpeg");
  return { photoOriginalKey: keys.original, ...(await storeDerived(postcardId, original)) };
}

/** Re-derives full + thumb from the stored original with a new crop. */
export async function recropPhoto(postcardId: string, originalKey: string, crop: Crop) {
  return storeDerived(postcardId, await getObjectBuffer(originalKey), crop);
}
