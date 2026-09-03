CREATE TABLE "asap_request" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"patient_id" uuid NOT NULL,
	"appointment_id" uuid NOT NULL,
	"earliest_date" date,
	"latest_date" date,
	"earliest_time" time,
	"latest_time" time,
	"allowed_isodow" smallint[],
	"priority_key" timestamp with time zone DEFAULT now() NOT NULL,
	"miss_count" smallint DEFAULT 0 NOT NULL,
	"state" "asap_state" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ck_allowed_isodow_valid" CHECK ("asap_request"."allowed_isodow" <@ ARRAY[1,2,3,4,5,6,7]::smallint[]),
	CONSTRAINT "ck_earliest_time_lt_latest" CHECK ("asap_request"."earliest_time" < "asap_request"."latest_time"),
	CONSTRAINT "ck_earliest_date_lte_latest" CHECK ("asap_request"."earliest_date" <= "asap_request"."latest_date")
);
--> statement-breakpoint
CREATE TABLE "slot_offer" (
	"id" uuid PRIMARY KEY DEFAULT uuidv7() NOT NULL,
	"asap_request_id" uuid NOT NULL,
	"time_claim_id" uuid NOT NULL,
	"state" "offer_state" DEFAULT 'offered' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"responded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "slot_offer_time_claim_id_unique" UNIQUE("time_claim_id")
);
--> statement-breakpoint
ALTER TABLE "slot_offer" ALTER COLUMN "state" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "slot_offer" ALTER COLUMN "state" SET DEFAULT 'offered'::text;--> statement-breakpoint
DROP TYPE "public"."offer_state";--> statement-breakpoint
CREATE TYPE "public"."offer_state" AS ENUM('offered', 'accepted', 'declined', 'expired');--> statement-breakpoint
ALTER TABLE "slot_offer" ALTER COLUMN "state" SET DEFAULT 'offered'::"public"."offer_state";--> statement-breakpoint
ALTER TABLE "slot_offer" ALTER COLUMN "state" SET DATA TYPE "public"."offer_state" USING "state"::"public"."offer_state";--> statement-breakpoint
ALTER TABLE "asap_request" ADD CONSTRAINT "asap_request_patient_id_patient_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patient"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asap_request" ADD CONSTRAINT "asap_request_appointment_id_appointment_id_fk" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_offer" ADD CONSTRAINT "slot_offer_asap_request_id_asap_request_id_fk" FOREIGN KEY ("asap_request_id") REFERENCES "public"."asap_request"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot_offer" ADD CONSTRAINT "slot_offer_time_claim_id_time_claim_id_fk" FOREIGN KEY ("time_claim_id") REFERENCES "public"."time_claim"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ux_asap_one_live_per_appointment" ON "asap_request" USING btree ("appointment_id") WHERE "asap_request"."state" IN ('active', 'offered');--> statement-breakpoint
CREATE UNIQUE INDEX "ux_one_live_offer" ON "slot_offer" USING btree ("asap_request_id") WHERE "slot_offer"."state" = 'offered';