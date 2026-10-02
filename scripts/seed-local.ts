// `npm run seed:local` (with `npm run local` running): replaces local data with fake postcards.
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
  photo?: { seed: string; portrait?: boolean };
  color?: string;
  title?: string;
  body?: string;
  note?: string;
  people?: string[];
  draft?: boolean;
};

const CARDS: Seed[] = [
  { when: "2025-10-18T18:10", lat: 43.6712, lng: -79.3524, place: "Riverdale Park East", color: "#c8553d", title: "Riverdale hill at sunset", people: ["Sam"],
    body: "Sat on the hill until the skyline went pink, then orange, then gone. Sam brought a thermos of cider that was mostly cinnamon." },
  { when: "2025-12-06T19:30", lat: 43.6503, lng: -79.3596, place: "Distillery District", photo: { seed: "distillery-lights" }, people: ["Aisha", "Jo"],
    body: "Christmas market. Too crowded to move, mulled wine in paper cups, Jo bought a wreath and carried it on the streetcar." },
  { when: "2025-12-20T20:00", lat: 43.6525, lng: -79.3835, place: "Nathan Phillips Square", color: "#264653", title: "First skate of the winter", people: ["Priya", "Dev"],
    body: "Dev fell exactly once, very dramatically. Priya skated backwards the whole time just to prove she could." },
  { when: "2026-01-24T14:15", lat: 43.6536, lng: -79.3925, place: "Art Gallery of Ontario", photo: { seed: "ago-gallery", portrait: true }, people: ["Dev"],
    body: "Free Wednesday night got moved, so we paid like adults. Stood in the Infinity Mirror room for longer than the allowed minute." },
  { when: "2026-02-15T11:40", lat: 43.6618, lng: -79.3741, place: "Allan Gardens", photo: { seed: "conservatory-green" },
    body: "Minus fifteen outside, thirty degrees in the palm house. Glasses fogged up immediately. Stayed an hour just to be warm." },
  { when: "2026-03-29T16:20", lat: 43.6297, lng: -79.4706, place: "Humber Bay Arch Bridge", photo: { seed: "humber-bridge" }, people: ["Dev"],
    body: "First bike ride of the year along the waterfront. Legs did not remember how. Ice still on the edges of the lake." },
  { when: "2026-04-25T10:30", lat: 43.6465, lng: -79.4637, place: "High Park", photo: { seed: "cherry-blossom", portrait: true }, people: ["Priya"],
    body: "Cherry blossoms. Packed, but worth it. Every second person had a tripod. We got there at 7:30 and it was already a festival." },
  { when: "2026-05-17T11:00", lat: 43.6624, lng: -79.3366, place: "Leslieville", color: "#e9c46a", title: "Sunday brunch, Queen East", people: ["Jo", "Dev"],
    body: "Ninety minute wait for pancakes. Would do it again. Jo had opinions about the hollandaise." },
  { when: "2026-05-30T19:45", lat: 43.6555, lng: -79.4141, place: "Little Italy", color: "#588157", title: "Patio season opens", people: ["Sam", "Jo"],
    body: "First patio of the year on College. Wore a jacket anyway. Sam declared summer officially open at 8:15pm." },
  { when: "2026-06-13T09:50", lat: 43.6846, lng: -79.3653, place: "Evergreen Brick Works", photo: { seed: "farmers-market" }, people: ["Aisha"],
    body: "Farmers market — strawberries, sourdough, and a very good dog in a wagon. Walked the ravine trail back after." },
  { when: "2026-07-04T15:30", lat: 43.7059, lng: -79.2318, place: "Scarborough Bluffs", photo: { seed: "bluffs-lake" }, people: ["Mateo", "Sam"],
    body: "Bluffer's Park. The cliffs are so much bigger in person. Lake was freezing; Mateo went in anyway." },
  { when: "2026-07-19T13:05", lat: 43.6339, lng: -79.354, place: "Jack Layton Ferry Terminal", color: "#2f6f8f", title: "Ferry to Ward's Island", people: ["Sam", "Mateo"],
    body: "Caught the 1pm ferry. Ward's beach, cheap sunscreen, a frisbee we lost in the first ten minutes. Best view of the city is from the boat back." },
  { when: "2026-07-26T19:10", lat: 43.6639, lng: -79.4205, place: "Christie Pits", photo: { seed: "baseball-evening" }, people: ["Mateo", "Dev"],
    body: "Maple Leafs game from the hill. Nobody watches the baseball, everyone watches the dogs." },
  { when: "2026-08-08T20:30", lat: 43.678, lng: -79.3497, place: "The Danforth", color: "#6d597a", title: "Taste of the Danforth", people: ["Aisha", "Priya", "Jo"],
    body: "Souvlaki, loukoumades, a stranger's wedding dance we got pulled into. Shoes ruined. No regrets." },
  { when: "2026-08-22T12:30", lat: 43.6545, lng: -79.4005, place: "Kensington Market", photo: { seed: "kensington-street" }, people: ["Jo"],
    body: "Pedestrian Sunday. Bought far too many dumplings and a plant I don't have room for. A guy was playing the saw." },
  { when: "2026-09-06T08:40", lat: 43.6243, lng: -79.3378, place: "Tommy Thompson Park", photo: { seed: "spit-birds" }, people: ["Mateo"],
    body: "The Leslie Spit at dawn. Herons, cormorants, and the entire downtown skyline looking small for once." },
  { when: "2026-09-20T20:30", lat: 43.6469, lng: -79.417, place: "Trinity Bellwoods", photo: { seed: "golden-park" }, people: ["Sam", "Priya"],
    body: "Golden hour in the park. Long walk, cold brew, the dog park at dusk. Summer's last real weekend." },

  // Drafts: quick captures waiting to be written up.
  { draft: true, when: "2026-09-27T23:10", lat: 43.6558, lng: -79.4106, photo: { seed: "rooftop-night" }, note: "rooftop at bar raval?? write this up" },
  { draft: true, when: "2026-09-30T19:25", lat: 43.6487, lng: -79.4205, note: "Ossington — amazing taco place, find the name" },
  { draft: true, when: "2026-09-14T15:00", lat: null, lng: null, photo: { seed: "camera-roll" }, note: "from the camera roll — where was this?" },
];

async function fetchPhoto(seed: string, portrait = false) {
  const [w, h] = portrait ? [1067, 1600] : [1600, 1067];
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

const names = [...new Set(CARDS.flatMap((c) => c.people ?? []))];
const personIds = new Map(
  (await db.insert(people).values(names.map((name) => ({ name }))).returning()).map((p) => [p.name, p.id]),
);

for (const c of CARDS) {
  const id = randomUUID();
  const photo = c.photo ? await processAndStorePhoto(id, await fetchPhoto(c.photo.seed, c.photo.portrait)) : {};
  const capturedAt = new Date(fromTorontoInput(c.when));
  await db.insert(postcards).values({
    id,
    status: c.draft ? "draft" : "published",
    publishedAt: c.draft ? null : capturedAt,
    capturedAt,
    lat: c.lat,
    lng: c.lng,
    placeLabel: c.place ?? null,
    frontColor: c.color ?? null,
    title: c.title ?? null,
    body: c.body ?? null,
    quickNote: c.note ?? null,
    ...photo,
  });
  if (c.people?.length) {
    await db.insert(postcardPeople).values(c.people.map((n) => ({ postcardId: id, personId: personIds.get(n)! })));
  }
  console.log(`${c.draft ? "draft    " : "published"}  ${c.title ?? c.place ?? c.note}`);
}

await pool.end();
console.log(`\nSeeded ${CARDS.length} postcards and ${names.length} people.`);
