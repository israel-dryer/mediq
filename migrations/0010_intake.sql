create table intake
(
    id             uuid primary key     default uuidv7(),
    appointment_id uuid        not null,
    raw_text       text        not null,
    proposed       jsonb, -- NULL when filled manually; never in a response
    model          text,  -- model identifier that produced proposed
    confirmed      jsonb,
    confirmed_at   timestamptz,
    created_at     timestamptz not null default now(),

    constraint ux_intake_appointment unique (appointment_id),
    constraint fk_intake_appointment foreign key (appointment_id) references appointment (id),
    constraint ck_intake_confirmed_pair check ((confirmed is null) = (confirmed_at is null)),
    constraint ck_intake_model_pair check ((model is null) = (proposed is null))
);
