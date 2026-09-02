CREATE OR REPLACE FUNCTION enforce_appointment_transition() RETURNS trigger AS $$
DECLARE v_actor actor_kind; v_start timestamptz;
BEGIN
    IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

    v_actor := current_setting('mediq.actor', true)::actor_kind;
    IF v_actor IS NULL THEN
        RAISE EXCEPTION 'mediq.actor not set' USING ERRCODE = 'check_violation';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM appointment_transition t
        WHERE t.from_status = OLD.status
            AND t.to_status = NEW.status
            AND t.actor = v_actor
    ) THEN
      RAISE EXCEPTION 'illegal transition % -> % for actor %',
        OLD.status, NEW.status, v_actor USING ERRCODE = 'check_violation';
    END IF;

    -- you cannot no-show an appointment that has not started
    IF NEW.status = 'no_show' THEN
        SELECT lower(during) INTO v_start FROM time_claim WHERE id = NEW.time_claim_id;
        IF v_start > now() THEN
            RAISE EXCEPTION 'cannot no-show before appointment starts'
                USING ERRCODE = 'check_violation';
        END IF;
    END IF;

    RETURN NEW;
END $$ LANGUAGE plpgsql;
--> statement-breakpoint
CREATE TRIGGER trg_appointment_transition
BEFORE UPDATE OF status ON appointment
FOR EACH ROW EXECUTE FUNCTION enforce_appointment_transition();
