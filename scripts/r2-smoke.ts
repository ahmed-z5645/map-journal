// Uploads a generated test image through the real pipeline and prints a presigned thumb URL.
// Usage: npm run r2-smoke
import sharp from "sharp";
import { processAndStorePhoto } from "../src/lib/images";
import { presignedGetUrl } from "../src/lib/r2";

const id = `smoke-test-${Date.now()}`;
const img = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#c8553d" } })
  .jpeg()
  .toBuffer();

const stored = await processAndStorePhoto(id, img);
console.log(stored);
console.log("thumb:", await presignedGetUrl(stored.photoThumbKey, 600));
