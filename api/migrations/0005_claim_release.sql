create or replace function release_claim(p_claim_id uuid) returns void as
$$
update time_claim
set released_at = now()
where id = p_claim_id
  and released_at is null
$$ language sql;

create or replace function appointment_release_on_status() returns trigger as
$$
begin
    -- 'no_show' does not free the time (it was already consumed)
    if new.status in ('canceled', 'bumped') and old.status not in ('canceled', 'bumped') then
        perform release_claim(new.time_claim_id);
    end if;
    return null;
end;
$$ language plpgsql;

create trigger trg_release_on_status
    after update of status
    on appointment
    for each row
execute function appointment_release_on_status();

create or replace function appointment_release_on_move() returns trigger as
$$
begin
    perform release_claim(old.time_claim_id); -- reschedule
    return null;
end;
$$ language plpgsql;

create trigger trg_release_on_move
    after update of time_claim_id
    on appointment
    for each row
    when (old.time_claim_id is distinct from new.time_claim_id)
execute function appointment_release_on_move();