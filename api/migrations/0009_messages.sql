create type message_channel as enum ('sms', 'email');
create type message_kind as enum (
    'booking_confirmation', 'reminder_7d', 'reminder_1d', 'cancellation_confirmation',
    'asap_offer', 'asap_offer_expired', 'asap_withdrawn', 'reschedule_confirmation'
    );

create table message_log
(
    id             uuid primary key         default uuidv7(),
    patient_id     uuid            not null,
    appointment_id uuid            not null,
    slot_offer_id  uuid,
    kind           message_kind    not null,
    channel        message_channel not null,
    body           text            not null,
    created_at     timestamptz     not null default now(),

    constraint fk_message_log_patient foreign key (patient_id) references patient (id),
    constraint fk_message_log_appointment foreign key (appointment_id) references appointment (id),
    constraint fk_message_log_slot_offer foreign key (slot_offer_id) references slot_offer (id),
    constraint ux_message_once unique nulls not distinct (appointment_id, kind, slot_offer_id)
);
