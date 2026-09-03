CREATE TYPE "public"."message_channel" AS ENUM('sms', 'email');--> statement-breakpoint
CREATE TYPE "public"."message_kind" AS ENUM('booking_confirmation', 'reminder_7d', 'reminder_1d', 'cancellation_confirmation', 'asap_offer', 'asap_offer_expired', 'asap_withdrawn', 'reschedule_confirmation');--> statement-breakpoint
CREATE TABLE "message_log" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"slot_offer_id" uuid,
	"kind" "message_kind" NOT NULL,
	"channel" "message_channel" NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ux_message_once" UNIQUE NULLS NOT DISTINCT("appointment_id","kind","slot_offer_id")
);
--> statement-breakpoint
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "message_log" ADD CONSTRAINT "message_log_slot_offer_id_slot_offer_id_fk" FOREIGN KEY ("slot_offer_id") REFERENCES "public"."slot_offer"("id") ON DELETE no action ON UPDATE no action;