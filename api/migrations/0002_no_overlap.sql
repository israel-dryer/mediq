CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
ALTER TABLE time_claim ADD CONSTRAINT no_overlap EXCLUDE USING gist (
    provider_id WITH =,
    during WITH &&
) WHERE (released_at IS NULL);