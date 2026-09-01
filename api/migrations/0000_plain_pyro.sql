CREATE TYPE "public"."asap_state" AS ENUM('active', 'offered', 'fulfilled', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."offer_state" AS ENUM('offered', 'accepted', 'declined', 'expired', 'revoked');--> statement-breakpoint
CREATE TABLE "appointment_type" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"code" text NOT NULL,
	"description" text NOT NULL,
	"duration" interval NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_type_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "location" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "patient" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"mrn" text NOT NULL,
	"last_name" text NOT NULL,
	"first_name" text NOT NULL,
	"dob" date,
	"phone" text,
	"email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_patient_mrn" UNIQUE("mrn"),
	CONSTRAINT "ux_patient_identity" UNIQUE NULLS NOT DISTINCT("last_name","dob","phone")
);
--> statement-breakpoint
CREATE TABLE "provider" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"display_name" text NOT NULL,
	"npi" char(10),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "provider_template" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"provider_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"isodow" smallint NOT NULL,
	"starts_at" time NOT NULL,
	"ends_at" time NOT NULL,
	CONSTRAINT "ck_day_of_week" CHECK ("provider_template"."isodow" BETWEEN 1 AND 7),
	CONSTRAINT "ck_start_less_than_end" CHECK ("provider_template"."starts_at" < "provider_template"."ends_at")
);
--> statement-breakpoint
ALTER TABLE "provider_template" ADD CONSTRAINT "provider_template_provider_id_provider_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."provider"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "provider_template" ADD CONSTRAINT "provider_template_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;