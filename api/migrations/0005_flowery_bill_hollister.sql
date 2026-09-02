CREATE TYPE "public"."actor_kind" AS ENUM('patient', 'staff', 'system');--> statement-breakpoint
CREATE TABLE "appointment_transition" (
	"from_status" "appointment_status" NOT NULL,
	"to_status" "appointment_status" NOT NULL,
	"actor" "actor_kind" NOT NULL,
	CONSTRAINT "pk_appointment_transition" PRIMARY KEY("from_status","to_status","actor")
);
