// Photo storage. On Vercel (BLOB_READ_WRITE_TOKEN set) photos go to Vercel Blob as public files
// with unguessable URLs; otherwise to an S3-compatible bucket (Cloudflare R2, or the local
// stand-in in `npm run local`) and are read through short-lived signed URLs.
//
// The photo columns hold a "ref": a Blob URL or an S3 key. Every helper here accepts either,
// so rows written by one backend keep working if the other is switched on.
import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { del, put } from "@vercel/blob";

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const isBlobRef = (ref: string) => ref.startsWith("https://");

const bucket = () => process.env.R2_BUCKET!;

let client: S3Client | undefined;
function s3() {
  client ??= new S3Client({
    region: "auto",
    // R2_ENDPOINT lets local dev point at an S3-compatible server (e.g. MinIO, or s3rver in local mode).
    endpoint: process.env.R2_ENDPOINT || `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    forcePathStyle: !!process.env.R2_ENDPOINT,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
  return client;
}

export const photoKeys = (postcardId: string) => ({
  original: `postcards/${postcardId}/original.jpg`,
  full: `postcards/${postcardId}/full.webp`,
  thumb: `postcards/${postcardId}/thumb.webp`,
});

/**
 * Stores `body` under `key` and returns its ref. Blob gets a random suffix so every upload has a
 * fresh URL (its CDN caches hard, so overwriting in place could show a stale crop).
 */
export async function putObject(key: string, body: Buffer, contentType: string): Promise<string> {
  if (useBlob()) {
    const blob = await put(key, body, { access: "public", contentType, addRandomSuffix: true });
    return blob.url;
  }
  await s3().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
  return key;
}

export async function getObjectBuffer(ref: string) {
  if (isBlobRef(ref)) {
    const res = await fetch(ref);
    if (!res.ok) throw new Error(`Couldn't fetch ${ref}: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  const res = await s3().send(new GetObjectCommand({ Bucket: bucket(), Key: ref }));
  return Buffer.from(await res.Body!.transformToByteArray());
}

export async function deleteObjects(refs: (string | null | undefined)[]) {
  const present = refs.filter((r): r is string => !!r);
  const blobs = present.filter(isBlobRef);
  const keys = present.filter((r) => !isBlobRef(r));
  await Promise.all([
    blobs.length > 0 ? del(blobs) : undefined,
    keys.length > 0
      ? s3().send(new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys.map((Key) => ({ Key })) } }))
      : undefined,
  ]);
}

/** A URL the browser can load: Blob URLs as they are, S3 keys signed for 12 hours (long enough for a tab left open). */
export async function objectUrl(ref: string, expiresIn = 12 * 60 * 60) {
  if (isBlobRef(ref)) return ref;
  return getSignedUrl(s3(), new GetObjectCommand({ Bucket: bucket(), Key: ref }), { expiresIn });
}
