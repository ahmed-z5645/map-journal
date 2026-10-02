import { DeleteObjectsCommand, PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const bucket = () => process.env.R2_BUCKET!;

let client: S3Client | undefined;
function r2() {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
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

export async function putObject(key: string, body: Buffer, contentType: string) {
  await r2().send(new PutObjectCommand({ Bucket: bucket(), Key: key, Body: body, ContentType: contentType }));
}

export async function deleteObjects(keys: string[]) {
  if (keys.length === 0) return;
  await r2().send(
    new DeleteObjectsCommand({ Bucket: bucket(), Delete: { Objects: keys.map((Key) => ({ Key })) } }),
  );
}

/** Short-lived URL for a private object. Only call this for an authenticated request. */
export function presignedGetUrl(key: string, expiresIn = 60 * 60) {
  return getSignedUrl(r2(), new GetObjectCommand({ Bucket: bucket(), Key: key }), { expiresIn });
}
