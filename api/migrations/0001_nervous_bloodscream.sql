CREATE TYPE "public"."appointment_status" AS ENUM('scheduled', 'confirmed', 'arrived', 'roomed', 'completed', 'canceled', 'no_show', 'bumped');--> statement-breakpoint
CREATE TYPE "public"."claim_kind" AS ENUM('appointment', 'hold', 'time_off', 'admin');--> statement-breakpoint
CREATE TABLE "time_claim" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"provider_id" uuid NOT NULL,
	"during" "tstzrange" NOT NULL,
	"kind" "claim_kind" NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	CONSTRAINT "ck_only_holds_expire" CHECK ("time_claim"."kind" = 'hold' OR "time_claim"."expires_at" IS NULL),
	CONSTRAINT "ck_non_appointments_described" CHECK ("time_claim"."kind" = 'appointment' OR "time_claim"."description" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "time_claim" ADD CONSTRAINT "time_claim_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ix_time_claim_expiring" ON "time_claim" USING btree ("expires_at") WHERE "time_claim"."released_at" IS NULL AND "time_claim"."expires_at" IS NOT NULL;