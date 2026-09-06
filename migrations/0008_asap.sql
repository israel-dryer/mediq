create type asap_state as enum ('active', 'offered', 'fulfilled', 'withdrawn');
create type offer_state as enum ('offered', 'accepted', 'declined', 'expired');

create table asap_request
(
    id             uuid primary key     default uuidv7(),
    patient_id     uuid        not null,
    appointment_id uuid        not null,
    earliest_date  date,
    latest_date    date,
    earliest_time  time,
    latest_time    time,
    allowed_isodow smallint[], -- null = any day
    priority_key   timestamptz not null default now(),
    miss_count     smallint    not null default 0,
    state          asap_state  not null default 'active',
    created_at     timestamptz not null default now(),
    updated_at     timestamptz not null default now(),

    constraint fk_asap_request_patient foreign key (patient_id) references patient (id),
    constraint fk_asap_request_appointment foreign key (appointment_id) references appointment (id),
    constraint ck_allowed_isodow_valid check (allowed_isodow <@ array [1,2,3,4,5,6,7]::smallint[]),
    constraint ck_earliest_time_lt_latest check (earliest_time < latest_time),
    constraint ck_earliest_date_lte_latest check (earliest_date <= latest_date)
);

create trigger trg_asap_request_updated_at
    before update
    on asap_request
    for each row
execute function set_updated_at();

-- one live request per appointment
create unique index ux_asap_one_live_per_appointment
    on asap_request (appointment_id)
    where state in ('active', 'offered');

create table slot_offer
(
    id              uuid primary key     default uuidv7(),
    asap_request_id uuid        not null,
    time_claim_id   uuid        not null,
    state           offer_state not null default 'offered',
    expires_at      timestamptz not null,                       -- the record; time_claim.expires_at is the control
    responded_at    timestamptz,
    created_at      timestamptz not null default now(),         -- `offeredAt`
    updated_at      timestamptz not null default now(),

    constraint ux_slot_offer_time_claim unique (time_claim_id), -- only one claim per offer
    constraint fk_slot_offer_asap_request foreign key (asap_request_id) references asap_request (id),
    constraint fk_slot_offer_time_claim foreign key (time_claim_id) references time_claim (id)
);

create trigger trg_slot_offer_updated_at
    before update
    on slot_offer
    for each row
execute function set_updated_at();

-- only one live offer per entry
create unique index ux_one_live_offer
    on slot_offer (asap_request_id)
    where state = 'offered';

