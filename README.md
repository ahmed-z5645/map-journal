# map-journal

Ahmed's field notes: polaroids and notes pinned on a map of Toronto. Next.js + Neon Postgres (Drizzle) + Vercel Blob for photos (or any S3-compatible bucket, like Cloudflare R2).

## Try it locally (no accounts)

```
npm install
npm run local        # embedded Postgres + local photo storage, app on http://localhost:3000
npm run seed:local   # in another terminal: fill it with fake Toronto entries
```

Log in with `postcards` (override with `LOCAL_PASSWORD`). Stop with Ctrl+C so the database closes cleanly. Data lives in `.local/`; `npm run local:reset` wipes it.

## Setup

1. **Postgres** — create a free [Neon](https://neon.tech) project and use its **pooled** connection string (use a dev branch for local work). Any local Postgres works too.
2. **Photos** — with no `BLOB_READ_WRITE_TOKEN`, photos go to an S3-compatible bucket: a private Cloudflare R2 bucket plus an API token with Object Read & Write on it, or any S3-compatible server via `R2_ENDPOINT` (e.g. MinIO). Production uses Vercel Blob; see DEPLOY.md.
3. `cp .env.example .env.local` and fill it in:
   - `npm run hash-password -- 'your password'` → paste the `APP_PASSWORD_HASH` line
   - `SESSION_SECRET`: `openssl rand -base64 32`
4. `npm install && npm run db:migrate`
5. `npm run dev` → http://localhost:3000

Check R2 end to end with `npm run r2-smoke` (uploads a test image and prints a presigned thumbnail URL).

## Layout

- `src/db/schema.ts` — `postcards`, `people`, `postcard_people`; migrations in `drizzle/` (`npm run db:generate` after schema changes)
- `src/lib/` — session (`auth.ts`, `session.ts`), password hashing, photo storage (`storage.ts`: Vercel Blob or S3), sharp image pipeline, map style (`map.ts`), site name (`site.ts`)
- `src/middleware.ts` — the Map and Scrapbook are public; everything else needs the admin login (server actions also check with `requireAdmin()`)
- `src/app/(app)/` — Map (`/`, with Arrange mode), Scrapbook, Drafts, Add (PWA start URL), card editor (`/cards/[id]/edit`)
- `src/components/entry.tsx` — the polaroid (flips over) and note used everywhere

## Deploy

Vercel (+ Blob) and Neon, both on free tiers. See **[DEPLOY.md](DEPLOY.md)** for the step-by-step guide, post-deploy checks, shipping changes and troubleshooting.
