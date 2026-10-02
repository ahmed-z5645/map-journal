import exifr from "exifr";

const MAX_EDGE = 2560;
const JPEG_QUALITY = 0.85;

export type PhotoMeta = {
  takenAt?: Date;
  lat?: number;
  lng?: number;
};

/** Reads time/GPS from the untouched file — compression below drops all EXIF. */
async function readMeta(file: File): Promise<PhotoMeta> {
  try {
    // The raw GPS tags must be picked too, or exifr can't derive latitude/longitude.
    const exif = await exifr.parse(file, {
      pick: ["DateTimeOriginal", "CreateDate", "GPSLatitude", "GPSLatitudeRef", "GPSLongitude", "GPSLongitudeRef"],
    });
    if (!exif) return {};
    const takenAt = exif.DateTimeOriginal ?? exif.CreateDate;
    return {
      takenAt: takenAt instanceof Date && !isNaN(takenAt.getTime()) ? takenAt : undefined,
      lat: typeof exif.latitude === "number" ? exif.latitude : undefined,
      lng: typeof exif.longitude === "number" ? exif.longitude : undefined,
    };
  } catch {
    return {};
  }
}

/**
 * Downscales to fit the ~4 MB server-action body limit (and mobile data).
 * createImageBitmap applies EXIF orientation, so the output is upright.
 */
async function compress(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not encode photo"))), "image/jpeg", JPEG_QUALITY),
  );
}

export async function preparePhoto(file: File) {
  const [meta, blob] = await Promise.all([readMeta(file), compress(file)]);
  return { meta, blob };
}
