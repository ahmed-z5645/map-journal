// `npm run seed:local` (with `npm run local` running): replaces local data with fake polaroids and notes.
// Photos are random stock images from picsum.photos, so they won't match the places.
import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import sharp from "sharp";
import { LOCAL_ENV } from "./local-env";

Object.assign(process.env, LOCAL_ENV);
const { people, postcardPeople, postcards } = await import("../src/db/schema");
const { processAndStorePhoto } = await import("../src/lib/images");
const { fromTorontoInput } = await import("../src/lib/dates");

if (!/@(127\.0\.0\.1|localhost):/.test(LOCAL_ENV.DATABASE_URL)) throw new Error("Refusing to seed a non-local database");

type Seed = {
  when: string; // Toronto time, "YYYY-MM-DDTHH:mm"
  lat: number | null;
  lng: number | null;
  place?: string;
  photo?: string; // picsum seed; a photo makes it a polaroid, otherwise it's a note
  shape?: "landscape" | "portrait" | "square" | "wide"; // photo shape, default landscape
  title?: string; // polaroids only
  body?: string;
  note?: string; // quick note from capture (drafts)
  people?: string[]; // polaroids only
  draft?: boolean;
};

const ENTRIES: Seed[] = [
  { when: "2025-10-18T18:10", lat: 43.6712, lng: -79.3524, place: "Riverdale Park East",
    body: "Riverdale hill at sunset. The skyline went pink, then orange, then gone. Cider that was mostly cinnamon." },
  { when: "2025-12-06T19:30", lat: 43.6503, lng: -79.3596, place: "Distillery District", photo: "distillery-lights", title: "xmas market", people: ["Aisha", "Jo"],
    body: "Too crowded to move, mulled wine in paper cups, Jo bought a wreath and carried it on the streetcar." },
  { when: "2025-12-20T20:00", lat: 43.6525, lng: -79.3835, place: "Nathan Phillips Square", photo: "skating-rink", shape: "portrait", title: "first skate ❄", people: ["Priya", "Dev"],
    body: "Dev fell exactly once, very dramatically. Priya skated backwards the whole time just to prove she could." },
  { when: "2026-01-24T14:15", lat: 43.6536, lng: -79.3925, place: "Art Gallery of Ontario", photo: "ago-gallery", shape: "portrait", people: ["Dev"],
    body: "Stood in the Infinity Mirror room for longer than the allowed minute." },
  { when: "2026-02-15T11:40", lat: 43.6618, lng: -79.3741, place: "Allan Gardens",
    body: "Minus fifteen outside, thirty degrees in the palm house. Glasses fogged instantly. Stayed an hour just to be warm.\n\nCome back in March for the spring flower show." },
  { when: "2026-03-29T16:20", lat: 43.6297, lng: -79.4706, place: "Humber Bay Arch Bridge", photo: "humber-bridge", shape: "wide", people: ["Dev"],
    body: "First bike ride of the year. Legs did not remember how. Ice still on the edges of the lake." },
  { when: "2026-04-25T10:30", lat: 43.6465, lng: -79.4637, place: "High Park", photo: "cherry-blossom", shape: "portrait", title: "sakura!!", people: ["Priya"],
    body: "Packed, but worth it. Every second person had a tripod. Got there at 7:30 and it was already a festival." },
  { when: "2026-05-17T11:00", lat: 43.6624, lng: -79.3366, place: "Leslieville",
    body: "Ninety minute wait for pancakes on Queen East. Would do it again.\n\nTry the place two doors down next time — no line." },
  { when: "2026-05-30T19:45", lat: 43.6555, lng: -79.4141, place: "Little Italy",
    body: "Patio season officially opens. Wore a jacket anyway." },
  { when: "2026-06-13T09:50", lat: 43.6846, lng: -79.3653, place: "Evergreen Brick Works", photo: "farmers-market", shape: "square", people: ["Aisha"],
    body: "Strawberries, sourdough, and a very good dog in a wagon. Walked the ravine trail back after." },
  { when: "2026-07-04T15:30", lat: 43.7059, lng: -79.2318, place: "Scarborough Bluffs", photo: "bluffs-lake", shape: "wide", title: "the bluffs", people: ["Mateo", "Sam"],
    body: "The cliffs are so much bigger in person. Lake was freezing; Mateo went in anyway." },
  { when: "2026-07-19T13:05", lat: 43.6339, lng: -79.354, place: "Jack Layton Ferry Terminal",
    body: "Best view of the city is from the ferry back from Ward's. Every single time." },
  { when: "2026-07-26T19:10", lat: 43.6639, lng: -79.4205, place: "Christie Pits", photo: "baseball-evening", people: ["Mateo", "Dev"],
    body: "Maple Leafs game from the hill. Nobody watches the baseball, everyone watches the dogs." },
  { when: "2026-08-08T20:30", lat: 43.678, lng: -79.3497, place: "The Danforth",
    body: "Taste of the Danforth. Souvlaki, loukoumades, a stranger's wedding dance. Shoes ruined. No regrets." },
  { when: "2026-08-22T12:30", lat: 43.6545, lng: -79.4005, place: "Kensington Market", photo: "kensington-street", shape: "portrait", title: "pedestrian sunday", people: ["Jo"],
    body: "Far too many dumplings and a plant I don't have room for. A guy was playing the saw." },
  { when: "2026-09-06T08:40", lat: 43.6243, lng: -79.3378, place: "Tommy Thompson Park", photo: "spit-birds", shape: "square", people: ["Mateo"],
    body: "The Spit at dawn. Herons, cormorants, and the whole skyline looking small for once." },
  { when: "2026-09-20T20:30", lat: 43.6469, lng: -79.417, place: "Trinity Bellwoods", photo: "golden-park", title: "golden hour", people: ["Sam", "Priya"],
    body: "Long walk, cold brew, the dog park at dusk. Summer's last real weekend." },

  // Drafts: quick captures waiting to be written up.
  { draft: true, when: "2026-09-27T23:10", lat: 43.6558, lng: -79.4106, photo: "rooftop-night", shape: "portrait", note: "rooftop at bar raval?? write this up" },
  { draft: true, when: "2026-09-30T19:25", lat: 43.6487, lng: -79.4205, note: "Ossington — amazing taco place, find the name" },
  { draft: true, when: "2026-09-14T15:00", lat: null, lng: null, photo: "camera-roll", note: "from the camera roll — where was this?" },
];

const SIZES = { landscape: [1600, 1200], portrait: [1200, 1600], square: [1400, 1400], wide: [1800, 1013] } as const;

async function fetchPhoto(seed: string, shape: keyof typeof SIZES = "landscape") {
  const [w, h] = SIZES[shape];
  try {
    const res = await fetch(`https://picsum.photos/seed/${seed}/${w}/${h}`);
    if (!res.ok) throw new Error(String(res.status));
    return Buffer.from(await res.arrayBuffer());
  } catch {
    // Offline: a plain gradient stands in.
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><defs><linearGradient id="g" x2="1" y2="1"><stop offset="0" stop-color="#e9c46a"/><stop offset="1" stop-color="#2f6f8f"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`;
    return sharp(Buffer.from(svg)).jpeg().toBuffer();
  }
}

const pool = new Pool({ connectionString: LOCAL_ENV.DATABASE_URL, max: 2 });
const db = drizzle(pool);

await db.execute(sql`truncate ${postcardPeople}, ${people}, ${postcards}`);

const names = [...new Set(ENTRIES.flatMap((e) => e.people ?? []))];
const personIds = new Map(
  (await db.insert(people).values(names.map((name) => ({ name }))).returning()).map((p) => [p.name, p.id]),
);

for (const e of ENTRIES) {
  const id = randomUUID();
  const kind = e.photo ? "polaroid" : "note";
  const photo = e.photo ? await processAndStorePhoto(id, await fetchPhoto(e.photo, e.shape)) : {};
  const capturedAt = new Date(fromTorontoInput(e.when));
  await db.insert(postcards).values({
    id,
    kind,
    status: e.draft ? "draft" : "published",
    publishedAt: e.draft ? null : capturedAt,
    capturedAt,
    lat: e.lat,
    lng: e.lng,
    placeLabel: e.place ?? null,
    title: e.title ?? null,
    // A captured note's text is the note itself.
    body: e.body ?? (kind === "note" ? e.note : null) ?? null,
    quickNote: e.note ?? null,
    ...photo,
  });
  if (e.people?.length) {
    await db.insert(postcardPeople).values(e.people.map((n) => ({ postcardId: id, personId: personIds.get(n)! })));
  }
  console.log(`${e.draft ? "draft    " : "published"}  ${kind.padEnd(8)}  ${e.title ?? e.place ?? e.note}`);
}

await pool.end();
console.log(`\nSeeded ${ENTRIES.length} entries and ${names.length} people.`);
