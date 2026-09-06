create type event_kind as enum ('created', 'status', 'moved');

create table appointment_event
(
    id             uuid primary key     default uuidv7(),
    appointment_id uuid        not null,
    at             timestamptz not null default now(),
    actor          actor_kind  not null,
    kind           event_kind  not null,
    from_status    appointment_status,
    to_status      appointment_status,
    from_claim_id  uuid,
    to_claim_id    uuid,
    detail         jsonb,

    constraint fk_appointment_event_appointment foreign key (appointment_id) references appointment (id)
);

create index ix_appointment_event_appointment on appointment_event (appointment_id, at);

create or replace function log_appointment_created() returns trigger as
$$
begin
    insert into appointment_event (appointment_id, actor, kind, to_status, to_claim_id)
    values (new.id, appointment_event_actor(), 'created', new.status, new.time_claim_id);
    return null;
end;
$$ language plpgsql;

create or replace function appointment_event_actor() returns actor_kind as
$$
declare
    v_actor text := nullif(current_setting('mediq.actor', true), '');
begin
    if v_actor is null then
        raise exception 'mediq.actor not set' using errcode = 'check_violation';
    end if;
    return v_actor::actor_kind;
end;
$$ language plpgsql;

create or replace function log_appointment_status() returns trigger as
$$
begin
    insert into appointment_event (appointment_id, actor, kind, from_status, to_status)
    values (new.id, appointment_event_actor(), 'status', old.status, new.status);
    return null;
end;
$$ language plpgsql;

create or replace function log_appointment_moved() returns trigger as
$$
begin
    insert into appointment_event (appointment_id, actor, kind, from_claim_id, to_claim_id)
    values (new.id, appointment_event_actor(), 'moved', old.time_claim_id, new.time_claim_id);
    return null;
end;
$$ language plpgsql;

create trigger trg_log_created
    after insert
    on appointment
    for each row
execute function log_appointment_created();

create trigger trg_log_status
    after update of status
    on appointment
    for each row
    when (old.status is distinct from new.status)
execute function log_appointment_status();

create trigger trg_log_moved
    after update of time_claim_id
    on appointment
    for each row
    when (old.time_claim_id is distinct from new.time_claim_id)
execute function log_appointment_moved();
