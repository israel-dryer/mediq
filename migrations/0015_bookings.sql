create or replace function book(
    p_patient uuid,
    p_provider uuid,
    p_type uuid,
    p_start timestamptz,
    p_origin appointment_origin
) returns uuid as
$$
declare
    v_duration    interval;
    v_location    uuid;
    v_window      tstzrange;
    v_claim       uuid;
    v_appointment uuid;

begin
    if coalesce(current_setting('mediq.actor', true), '') = '' then
        raise exception 'mediq.actor not set' using errcode = 'check_violation';
    end if;

    select duration into v_duration from appointment_type where id = p_type;
    if v_duration is null then
        raise exception 'appointment_type not found' using errcode = 'P0002';
    end if;

    -- provider's location: templates carry it; one location in v1
    select location_id
    into v_location
    from provider_template
    where provider_id = p_provider
    limit 1;
    if v_location is null then
        raise exception 'provider not found' using errcode = 'P0002';
    end if;

    v_window := tstzrange(p_start, p_start + v_duration, '[)');

    -- an expired hold that has not yet been swept should not block booking
    -- only holds have an expires_at
    update time_claim
    set released_at = now()
    where provider_id = p_provider
      and during && v_window
      and released_at is null
      and expires_at is not null
      and expires_at < now();

    begin
        insert into time_claim (provider_id, during, kind, created_by)
        values (p_provider,
                v_window,
                'appointment',
                concat(current_setting('mediq.actor', true), ':', coalesce(p_patient::text, '')))
        returning id into v_claim;
    exception
        when exclusion_violation then
            raise exception 'slot_taken' using errcode = 'P0001';
    end;

    insert into appointment (time_claim_id, patient_id, location_id, type_id, origin)
    values (v_claim, p_patient, v_location, p_type, p_origin)
    returning id into v_appointment;

    return v_appointment;
end;
$$ language plpgsql;

create or replace function cancel(p_appointment uuid) returns void as
$$
begin
    update appointment
    set status = 'canceled'
    where id = p_appointment;
    if not found then
        raise exception 'appointment not found' using errcode = 'P0002';
    end if;
end;
$$ language plpgsql;
