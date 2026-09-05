-- an appointment type is at least 10 whole minutes
alter table appointment_type
    add constraint ck_realistic_duration
        check (duration >= interval '10 minutes'
            and duration = date_trunc('minute', duration));