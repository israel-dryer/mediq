create type claim_kind as enum ('appointment', 'hold', 'time_off', 'admin');

create table time_claim
(
    id          uuid primary key     default uuidv7(),
    provider_id uuid        not null,
    during      tstzrange   not null,
    kind        claim_kind  not null,
    description text,
    created_by  text        not null, -- 'staff:<id>', | 'patient:<id>' | 'system:asap'
    created_at  timestamptz not null default now(),
    updated_at  timestamptz not null default now(),
    expires_at  timestamptz,          -- holds only: NULL = never lapses
    released_at timestamptz,

    constraint fk_time_claim_provider foreign key (provider_id) references provider (id),
    constraint ck_only_holds_expire check (kind = 'hold' or expires_at is null),
    constraint ck_non_appointments_described check (kind = 'appointment' or description is not null ),
    constraint no_overlap exclude using gist ( provider_id with =, during with && ) where (released_at is null)
);

create trigger trg_time_claim_updated_at
    before update
    on time_claim
    for each row
execute function set_updated_at();

-- partial index on live time claims (non-appointments)
create index ix_time_claim_expiring
    on time_claim (expires_at)
    where released_at is null and expires_at is not null;
