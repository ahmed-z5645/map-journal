CREATE TYPE "public"."entry_kind" AS ENUM('polaroid', 'note');--> statement-breakpoint
ALTER TABLE "postcards" ADD COLUMN "kind" "entry_kind";--> statement-breakpoint
-- Backfill: photo cards become polaroids; colour-front cards become notes,
-- with their title folded into the text since notes have no title.
UPDATE "postcards" SET "kind" = 'polaroid' WHERE "photo_full_key" IS NOT NULL;--> statement-breakpoint
UPDATE "postcards" SET
  "kind" = 'note',
  "body" = NULLIF(concat_ws(E'\n\n', "title", "body"), ''),
  "title" = NULL,
  "photo_original_key" = NULL
WHERE "photo_full_key" IS NULL;--> statement-breakpoint
UPDATE "postcards" SET "body" = COALESCE("body", "quick_note", '') WHERE "kind" = 'note' AND "status" = 'published' AND "body" IS NULL;--> statement-breakpoint
ALTER TABLE "postcards" ALTER COLUMN "kind" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "postcards" ADD CONSTRAINT "polaroid_has_photo" CHECK ("postcards"."kind" <> 'polaroid' OR "postcards"."photo_full_key" IS NOT NULL);--> statement-breakpoint
ALTER TABLE "postcards" ADD CONSTRAINT "note_is_text_only" CHECK ("postcards"."kind" <> 'note' OR ("postcards"."photo_original_key" IS NULL AND "postcards"."title" IS NULL));--> statement-breakpoint
ALTER TABLE "postcards" ADD CONSTRAINT "published_note_has_text" CHECK ("postcards"."status" = 'draft' OR "postcards"."kind" <> 'note' OR "postcards"."body" IS NOT NULL);