import { sql } from "drizzle-orm";
import {
  check,
  doublePrecision,
  index,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  real,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const postcardStatus = pgEnum("postcard_status", ["draft", "published"]);

export const postcards = pgTable(
  "postcards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    status: postcardStatus("status").notNull().default("draft"),

    // Front: a photo, or (when all photo keys are null) a solid colour.
    frontColor: text("front_color"),
    photoOriginalKey: text("photo_original_key"),
    photoFullKey: text("photo_full_key"),
    photoThumbKey: text("photo_thumb_key"),
    photoWidth: integer("photo_width"),
    photoHeight: integer("photo_height"),

    // Back. Title is only rendered when there's no photo, but always stored.
    title: text("title"),
    body: text("body"),
    quickNote: text("quick_note"),

    // Where / when. Drafts may lack a location; published cards may not.
    lat: doublePrecision("lat"),
    lng: doublePrecision("lng"),
    locationAccuracyM: real("location_accuracy_m"),
    placeLabel: text("place_label"),
    capturedAt: timestamp("captured_at", { withTimezone: true }).notNull().defaultNow(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    index("postcards_status_captured_idx").on(t.status, t.capturedAt.desc()),
    check(
      "published_has_location",
      sql`${t.status} = 'draft' OR (${t.lat} IS NOT NULL AND ${t.lng} IS NOT NULL AND ${t.publishedAt} IS NOT NULL)`,
    ),
  ],
);

export const people = pgTable(
  "people",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("people_name_lower_idx").on(sql`lower(${t.name})`)],
);

export const postcardPeople = pgTable(
  "postcard_people",
  {
    postcardId: uuid("postcard_id")
      .notNull()
      .references(() => postcards.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.postcardId, t.personId] }),
    index("postcard_people_person_idx").on(t.personId),
  ],
);

export type Postcard = typeof postcards.$inferSelect;
export type NewPostcard = typeof postcards.$inferInsert;
export type Person = typeof people.$inferSelect;
