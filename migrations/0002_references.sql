create or replace function set_updated_at() returns trigger as
$$
begin
    new.updated_at := now();
    return new;
end;
$$ language plpgsql;

create table location
(
    id         uuid primary key     default uuidv7(),
    name       text        not null,
    is_active  boolean     not null default true,
    timezone   text        not null default 'America/New_York',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create trigger trg_location_updated_at
    before update
    on location
    for each row
execute function set_updated_at();

create table provider
(
    id           uuid primary key     default uuidv7(),
    display_name text        not null,
    npi          char(10),
    is_active    boolean     not null default true,
    created_at   timestamptz not null default now(),
    updated_at   timestamptz not null default now()
);

create trigger trg_provider_updated_at
    before update
    on provider
    for each row
execute function set_updated_at();

create table appointment_type
(
    id          uuid primary key     default uuidv7(),
    code        text        not null, -- 'NP','FU','PHYS','PROC','NURSE'
    description text        not null,
    duration    interval    not null,
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),

    constraint ux_appointment_type_code unique (code)
);

create trigger trg_appointment_type_updated_at
    before update
    on appointment_type
    for each row
execute function set_updated_at();

create table patient
(
    id         uuid primary key     default uuidv7(),
    mrn        text        not null, -- medical record number
    last_name  text        not null,
    first_name text        not null,
    dob        date,
    phone      text,
    email      text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint ux_patient_mrn unique (mrn),
    constraint ux_patient_identity unique nulls not distinct (last_name, dob, phone)
);

create trigger trg_patient_updated_at
    before update
    on patient
    for each row
execute function set_updated_at();

create table provider_template
(
    id          uuid primary key default uuidv7(),
    provider_id uuid     not null,
    location_id uuid     not null,
    isodow      smallint not null, -- 1 = Monday ... 7 = Sunday
    starts_at   time     not null,
    ends_at     time     not null,
    constraint fk_provider_template_provider foreign key (provider_id) references provider (id),
    constraint fk_provider_template_location foreign key (location_id) references location (id),
    constraint ck_day_of_week check (isodow between 1 and 7),
    constraint ck_start_less_than_end check (starts_at < ends_at)
);

