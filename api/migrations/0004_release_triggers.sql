CREATE OR REPLACE FUNCTION release_claim(p_claim_id uuid) RETURNS void AS $$
    UPDATE time_claim SET released_at = now()
    WHERE id = p_claim_id AND released_at IS NULL;
$$ LANGUAGE sql;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION appointment_release_on_status() RETURNS trigger AS $$
BEGIN
    -- time is freed when 'canceled' and 'bumped'. 'no_show' does NOT. This time
    -- was consumed, not freed, and releasing it corrupts what 'released_at' measures.
    IF NEW.status IN ('canceled', 'bumped')
        AND OLD.status NOT IN ('canceled', 'bumped') THEN
        PERFORM release_claim(NEW.time_claim_id);
    END IF;
    RETURN NULL;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_release_on_status
AFTER UPDATE OF status ON appointment
FOR EACH ROW EXECUTE FUNCTION appointment_release_on_status();
--> statement-breakpoint
CREATE OR REPLACE FUNCTION appointment_release_on_move() RETURNS trigger AS $$
BEGIN
    PERFORM release_claim(OLD.time_claim_id);  -- reschedule: old claim is vacated
    RETURN NULL;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_release_on_move
AFTER UPDATE OF time_claim_id ON appointment
FOR EACH ROW WHEN (OLD.time_claim_id IS DISTINCT FROM NEW.time_claim_id)
EXECUTE FUNCTION appointment_release_on_move();