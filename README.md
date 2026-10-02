# map-journal

A personal journal of postcards pinned on a map of Toronto. Next.js + Neon Postgres (Drizzle) + Cloudflare R2.

## Setup

1. **Postgres** — create a free [Neon](https://neon.tech) project and use its **pooled** connection string (use a dev branch for local work). Any local Postgres works too.
2. **R2** — create a private bucket and an R2 API token with Object Read & Write on it. For offline dev, set `R2_ENDPOINT` to any S3-compatible server (e.g. MinIO).
3. `cp .env.example .env.local` and fill it in:
   - `npm run hash-password -- 'your password'` → paste the `APP_PASSWORD_HASH` line
   - `SESSION_SECRET`: `openssl rand -base64 32`
4. `npm install && npm run db:migrate`
5. `npm run dev` → http://localhost:3000

Check R2 end to end with `npm run r2-smoke` (uploads a test image and prints a presigned thumbnail URL).

## Layout

- `src/db/schema.ts` — `postcards`, `people`, `postcard_people`; migrations in `drizzle/` (`npm run db:generate` after schema changes)
- `src/lib/` — session (`auth.ts`), password hashing, R2 client, sharp image pipeline
- `src/middleware.ts` — everything except `/login` and PWA assets requires the session cookie
- `src/app/(app)/` — Map (`/`, with Arrange mode), Shoebox, Drafts, Add (PWA start URL), card editor (`/cards/[id]/edit`)
- `src/components/postcard.tsx` — the two-sided flip card used everywhere

## Deploy

Vercel Hobby: import the repo and set the same env vars.
