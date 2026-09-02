CREATE TYPE "public"."appointment_origin" AS ENUM('patient', 'staff');--> statement-breakpoint
CREATE TABLE "appointment" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"time_claim_id" uuid NOT NULL,
	"patient_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"type_id" uuid NOT NULL,
	"status" "appointment_status" DEFAULT 'scheduled' NOT NULL,
	"origin" "appointment_origin" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointment_time_claim_id_unique" UNIQUE("time_claim_id")
);
--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_time_claim_id_time_claim_id_fk" FOREIGN KEY ("time_claim_id") REFERENCES "public"."time_claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_location_id_location_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."location"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointment" ADD CONSTRAINT "appointment_type_id_appointment_type_id_fk" FOREIGN KEY ("type_id") REFERENCES "public"."appointment_type"("id") ON DELETE no action ON UPDATE no action;