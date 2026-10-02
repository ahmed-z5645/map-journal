CREATE TYPE "public"."postcard_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TABLE "people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "postcard_people" (
	"postcard_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	CONSTRAINT "postcard_people_postcard_id_person_id_pk" PRIMARY KEY("postcard_id","person_id")
);
--> statement-breakpoint
CREATE TABLE "postcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"status" "postcard_status" DEFAULT 'draft' NOT NULL,
	"front_color" text,
	"photo_original_key" text,
	"photo_full_key" text,
	"photo_thumb_key" text,
	"photo_width" integer,
	"photo_height" integer,
	"title" text,
	"body" text,
	"quick_note" text,
	"lat" double precision,
	"lng" double precision,
	"location_accuracy_m" real,
	"place_label" text,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "published_has_location" CHECK ("postcards"."status" = 'draft' OR ("postcards"."lat" IS NOT NULL AND "postcards"."lng" IS NOT NULL AND "postcards"."published_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "postcard_people" ADD CONSTRAINT "postcard_people_postcard_id_postcards_id_fk" FOREIGN KEY ("postcard_id") REFERENCES "public"."postcards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "postcard_people" ADD CONSTRAINT "postcard_people_person_id_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "people_name_lower_idx" ON "people" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "postcard_people_person_idx" ON "postcard_people" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "postcards_status_captured_idx" ON "postcards" USING btree ("status","captured_at" DESC NULLS LAST);