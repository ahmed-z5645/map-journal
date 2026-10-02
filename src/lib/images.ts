import sharp from "sharp";
import { photoKeys, putObject } from "./r2";

const FULL_MAX = 2000;
const THUMB_MAX = 400;

/**
 * Stores the (client-compressed) original, then derives full + thumb WebP versions.
 * sharp drops EXIF by default, so the served files carry no GPS metadata.
 */
export async function processAndStorePhoto(postcardId: string, input: Buffer) {
  const keys = photoKeys(postcardId);
  // .rotate() applies EXIF orientation before metadata is stripped.
  const base = sharp(input).rotate();

  const [full, thumb, original] = await Promise.all([
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
    base.clone().jpeg({ quality: 90 }).toBuffer(),
  ]);

  await Promise.all([
    putObject(keys.original, original, "image/jpeg"),
    putObject(keys.full, full.data, "image/webp"),
    putObject(keys.thumb, thumb, "image/webp"),
  ]);

  return {
    photoOriginalKey: keys.original,
    photoFullKey: keys.full,
    photoThumbKey: keys.thumb,
    photoWidth: full.info.width,
    photoHeight: full.info.height,
  };
}
