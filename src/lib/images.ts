import sharp from "sharp";
import { getObjectBuffer, photoKeys, putObject } from "./r2";

const FULL_MAX = 2000;
const THUMB_MAX = 400;

/** Crop as fractions (0–1) of the original's width/height, so it's resolution-independent. */
export type Crop = { x: number; y: number; width: number; height: number };

/** The largest centred square — a polaroid's default framing. */
function centreSquare(width: number, height: number): Crop {
  const side = Math.min(width, height);
  return { x: (width - side) / 2 / width, y: (height - side) / 2 / height, width: side / width, height: side / height };
}

/** Writes full + thumb WebP versions of `original`, cropped (centre square by default). sharp drops EXIF by default. */
async function storeDerived(postcardId: string, original: Buffer, requested?: Crop) {
  const keys = photoKeys(postcardId);
  const source = sharp(original);
  const { width = 0, height = 0 } = await source.metadata();
  const crop = requested ?? centreSquare(width, height);
  const left = Math.round(crop.x * width);
  const top = Math.round(crop.y * height);
  const base = source.extract({
    left,
    top,
    width: Math.max(1, Math.min(width - left, Math.round(crop.width * width))),
    height: Math.max(1, Math.min(height - top, Math.round(crop.height * height))),
  });

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
