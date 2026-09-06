create type appointment_status as enum (
    'scheduled', 'confirmed', 'arrived', 'roomed',
    'completed', 'canceled', 'no_show', 'bumped'
    );

create type appointment_origin as enum ('patient', 'staff');

create table appointment
(
    id            uuid primary key            default uuidv7(),
    time_claim_id uuid               not null,
    patient_id    uuid               not null,
    location_id   uuid               not null,
    type_id       uuid               not null,
    status        appointment_status not null default 'scheduled',
    origin        appointment_origin not null,
    created_at    timestamptz        not null default now(),
    updated_at    timestamptz        not null default now(),

    constraint ux_appointment_time_claim unique (time_claim_id),
    constraint fk_appointment_time_claim foreign key (time_claim_id) references time_claim (id),
    constraint fk_appointment_patient foreign key (patient_id) references patient (id),
    constraint fk_appointment_location foreign key (location_id) references location (id),
    constraint fk_appointment_appointment_type foreign key (type_id) references appointment_type (id)
);

create trigger trg_appointment_updated_at
    before update
    on appointment
    for each row
execute function set_updated_at();
