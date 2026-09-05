create type actor_kind as enum ('patient', 'staff', 'system');

create table appointment_transition
(
    from_status appointment_status not null,
    to_status   appointment_status not null,
    actor       actor_kind         not null,
    constraint pk_appointment_transition primary key (from_status, to_status, actor)
);

create or replace function enforce_appointment_transition() returns trigger as
$$
declare
    v_actor actor_kind; v_start timestamptz;
begin
    if new.status is not distinct from old.status then return new; end if;

    v_actor := current_setting('mediq.actor', true)::actor_kind;
    if v_actor is null then
        raise exception 'mediq.actor not set' using errcode = 'check_violation';
    end if;

    -- no fallback
    if not exists (select 1
                   from appointment_transition t
                   where t.from_status = old.status
                     and t.to_status = new.status
                     and t.actor = v_actor) then
        raise exception 'illegal transition % -> % for actor %',
            old.status, new.status, v_actor using errcode = 'check_violation';
    end if;

    -- you cannot 'no_show' an appointment that has not started
    if new.status = 'no_show' then
        select lower(during) into v_start from time_claim where id = new.time_claim_id;
        if v_start > now() then
            raise exception 'cannot no-show before the appointment starts'
                using errcode = 'check_violation';
        end if;
    end if;
    return new;
end;
$$ language plpgsql;

create trigger trg_appointment_transition
    before update of status
    on appointment
    for each row
execute function enforce_appointment_transition();