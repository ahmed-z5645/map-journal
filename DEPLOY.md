# Deploying Ahmed's field notes

The app runs on **Vercel** (the Next.js app and **Vercel Blob** for photos) and **Neon** (Postgres). Both have free tiers, with no card needed, that comfortably cover a personal journal shared with friends.

Once it's set up, deploying is just pushing to `main`.

## What's public

- **Anyone with the link** can see the Map (`/`) and the Scrapbook (`/scrapbook`): published entries only, with their photos, notes, places and people.
- **Only you** (logged in at `/admin` or `/login`) can add, edit, arrange, publish and delete entries, and see drafts. The server enforces this on every page and action, not just by hiding buttons.

## 1. Database (Neon)

1. Create a project at [neon.tech](https://neon.tech). Pick a region close to where Vercel will run (e.g. `us-east`).

   Neon may then show a "Set up this Neon project" prompt (`npm i -g neon`, `neon link`, `neon config init`, a `neon.ts` file…). **Skip it.** The app connects with a plain connection string, so none of that is used.

2. On the dashboard, open **Connect**, turn on **Connection pooling**, and copy the connection string. The host must contain `-pooler`; that's what makes it safe to use from serverless functions.
3. Save it in `.env.local` in the project folder (already ignored by git) as a single line, **with `DATABASE_URL=` in front**:

   ```sh
   DATABASE_URL=postgresql://…@ep-…-pooler.….neon.tech/neondb?sslmode=require&channel_binding=require
   ```

   Just pasting the bare `postgresql://…` string won't work; the tools look for the `DATABASE_URL=` name.

4. Create the tables by running the migrations once (they read `.env.local`):

   ```sh
   npm run db:migrate
   ```

> Tip: use a separate Neon **branch** for local development so you never test against your real entries.

## 2. Photo storage (Vercel Blob)

Photos are stored in **Vercel Blob**, which comes with Vercel's free Hobby plan; no card needed (Cloudflare R2 asks for billing details even on its free tier). You'll create the store in **4. Vercel** below, once the Vercel project exists.

Blob files are **public URLs with a long random part**, so nobody can find a photo without being given its link. Published photos are on the public map anyway. Draft photos also live at unguessable public URLs, and a copied link keeps working until the photo is deleted.

Each upload gets its own fresh URL, because Blob's CDN caches files hard and overwriting one could keep showing an old crop. When you re-crop or replace a photo, or delete a draft, the app deletes the old files itself, so nothing piles up.

> Prefer private photos? Vercel Blob also offers private files, which would need a small change to serve photos through the app. Or use a private S3-compatible bucket such as Cloudflare R2, read through short-lived signed links, which the app already supports: leave Blob unconnected and set the `R2_*` variables from `.env.example` instead.

## 3. Secrets

Generate these on your machine:

```sh
npm run hash-password -- 'the password you'll log in with'
# → APP_PASSWORD_HASH=…   (copy the part after the =)

openssl rand -base64 32
# → SESSION_SECRET
```

Only the *hash* of your password is stored; the password itself never goes into Vercel.

## 4. Vercel

1. At [vercel.com/new](https://vercel.com/new), import the GitHub repo. Vercel detects Next.js; leave the build settings as they are.
2. Before the first deploy, add these **Environment Variables** (for Production, and Preview if you want preview deploys to work):

   | Name | Value |
   | --- | --- |
   | `DATABASE_URL` | Neon **pooled** connection string (step 1) |
   | `APP_PASSWORD_HASH` | output of `npm run hash-password` |
   | `SESSION_SECRET` | output of `openssl rand -base64 32` |

   Don't add any `R2_*` variables; photos go to Vercel Blob instead.

3. Under **Storage**, choose **Create → Blob**, name it (e.g. `field-notes-photos`), and **connect it to this project** for Production and Preview. Vercel adds `BLOB_READ_WRITE_TOKEN` to the project automatically, and that's what switches photo storage to Blob.
4. Deploy (or **Redeploy** if the first deploy ran before Blob was connected). Under **Settings → Git**, check the production branch is `main`.

## 5. Custom domain: map.ahmedzafar.ca

Use a **subdomain** rather than `ahmedzafar.ca/map`. This is its own app (own database, login and photos, and a different Next.js version from the personal site), and a subdomain needs no code changes. Serving it under `/map` would need a `basePath`, path fixes throughout, and a proxy from the personal site that server actions would have to pass through.

1. In this Vercel project, go to **Settings → Domains**, add `map.ahmedzafar.ca`, and follow the DNS record Vercel shows. It's usually a `CNAME` for `map` pointing at `cname.vercel-dns.com`, added wherever `ahmedzafar.ca`'s DNS is managed. If the domain already uses Vercel's nameservers, it's set up automatically.
2. Wait for the domain to show **Valid Configuration**. HTTPS is issued automatically.
3. *(Optional)* Keep `ahmedzafar.ca/map` working as a short link with a redirect in the personal site's `next.config.ts`:

   ```ts
   async redirects() {
     return [{ source: "/map", destination: "https://map.ahmedzafar.ca", permanent: false }];
   },
   ```

   That site's `next.config.ts` currently sets both `module.exports = { rewrites }` and `export default nextConfig`, so one of the two may be ignored. Merge them into a single config object when adding this.

## 6. Check it works

On the deployed URL:

- [ ] `/` shows the map **without logging in**, with no Drafts, Add or Arrange controls.
- [ ] `/scrapbook` shows the corkboard; tapping a polaroid opens it.
- [ ] `/add` sends you to the login page; logging in brings you back.
- [ ] Add a polaroid from your phone, publish it, and check it appears on the map and in the Scrapbook with its photo.
- [ ] Open a private window: the new entry is visible, and drafts aren't.

On your phone, open `/login` and use **Share → Add to Home Screen**. The home-screen app opens straight to **Add**, for quick capture. (If a friend adds the site to their home screen, it opens on the login page, since Add is admin-only. They should just bookmark the map instead.)

## Shipping changes

- **Deploy:** push (or merge) to `main`. Vercel builds and deploys automatically; other branches get preview URLs.
- **Database changes:** after editing `src/db/schema.ts`, run `npm run db:generate` and commit the new file in `drizzle/`. Then run `npm run db:migrate` against the production `DATABASE_URL` **before** merging the code that needs it.
- **Releases:** tag the commit on `main` and push the tag, e.g. `git tag -a v3 -m "v3: …" && git push origin v3`.
- **Rolling back:** in Vercel, open **Deployments**, pick the last good one, and choose **Instant Rollback** (or **Promote to Production**). Each tag (`v1`, `v2`, …) marks a known-good version in git.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Every page errors with `DATABASE_URL is not set` / `SESSION_SECRET is not set` | The env var is missing in Vercel, or was added after the last deploy. Redeploy after adding it. |
| Login says `APP_PASSWORD_HASH is not configured` | Same as above, for `APP_PASSWORD_HASH`. |
| Login says `Wrong password` | The hash was made from a different password. Regenerate it and update the env var. |
| `npm run db:migrate` fails with no database URL, or "Invalid URL" | `.env.local` is missing, or its line doesn't start with `DATABASE_URL=`. |
| Database errors under load, or "too many connections" | `DATABASE_URL` isn't the **pooled** (`-pooler`) string. |
| Uploads fail with an R2 or S3 error | Blob isn't connected, so the app fell back to S3 storage. Connect the Blob store to the project (Storage tab) and redeploy. |
| Uploads fail with a Blob error | The Blob store was disconnected or its token rotated. Reconnect it under Storage and redeploy. |
| Map is blank but stickers show | The map tiles (OpenFreeMap) or the MapLibre worker didn't load. The worker is copied into `public/maplibre/` by `npm install`'s postinstall step; check the build log ran it. |
| `map.ahmedzafar.ca` shows "Invalid Configuration" | The DNS record hasn't been added or hasn't spread yet. Check it matches what **Settings → Domains** asks for; changes can take up to a few hours. |
| Old `/shoebox` links | They redirect to `/scrapbook` automatically. |
