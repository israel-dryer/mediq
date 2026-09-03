import {sql} from 'drizzle-orm';
import {
    boolean,
    char,
    check,
    date,
    index,
    interval,
    pgTable,
    primaryKey,
    smallint,
    text,
    time,
    timestamp,
    unique,
    uniqueIndex,
    uuid,
} from 'drizzle-orm/pg-core';
import {tstzrange} from "./types.js";
import {
    actorKind,
    appointmentOrigin,
    appointmentStatus,
    asapState,
    claimKind,
    messageChannel, messageKind,
    offerState
} from "./enums.js";

/* Convenience Functions */

export const _id = () => {
    return uuid('id').primaryKey().default(sql`uuidv7()`);
};

export const _createdAt = () => {
    return timestamp('created_at', {withTimezone: true}).notNull().defaultNow();
};

export const _updatedAt = () => {
    return timestamp('updated_at', {withTimezone: true})
        .notNull()
        .defaultNow().$onUpdate(() => sql`now()`)
}

/* Database Tables */

export const location = pgTable("location", {
    id: _id(),
    name: text("name").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    timezone: text("timezone").notNull().default("America/New_York"),
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
});

export const provider = pgTable("provider", {
    id: _id(),
    displayName: text("display_name").notNull(),
    npi: char("npi", {length: 10}),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
});

export const appointmentType = pgTable("appointment_type", {
    id: _id(),
    code: text("code").notNull().unique(),
    description: text("description").notNull(), duration: interval("duration").notNull(),
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
});

export const patient = pgTable("patient", {
    id: _id(),
    mrn: text("mrn").notNull().unique("ux_patient_mrn"),
    lastName: text("last_name").notNull(),
    firstName: text("first_name").notNull(),
    dob: date("dob"),
    phone: text("phone"),
    email: text("email"),
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
}, t => [
    unique("ux_patient_identity").on(t.lastName, t.dob, t.phone).nullsNotDistinct()
]);

export const providerTemplate = pgTable("provider_template", {
    id: _id(),
    providerId: uuid("provider_id").notNull().references(() => provider.id),
    locationId: uuid("location_id").notNull().references(() => location.id),
    isodow: smallint("isodow").notNull(),
    startsAt: time("starts_at").notNull(),
    endsAt: time("ends_at").notNull(),
}, t => [
    check("ck_day_of_week", sql`${t.isodow} BETWEEN 1 AND 7`),
    check("ck_start_less_than_end", sql`${t.startsAt} < ${t.endsAt}`)
]);

export const timeClaim = pgTable("time_claim", {
    id: _id(),
    providerId: uuid("provider_id").notNull().references(() => provider.id),
    during: tstzrange("during").notNull(),
    kind: claimKind("kind").notNull(),
    description: text("description"),
    createdBy: text("created_by").notNull(), // 'staff:<id>' | 'patient:<id>' | 'system
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
    expiresAt: timestamp("expires_at", {withTimezone: true}),
    releasedAt: timestamp("released_at", {withTimezone: true}),
}, t => [
    check("ck_only_holds_expire", sql`${t.kind} = 'hold' OR ${t.expiresAt} IS NULL`),
    check("ck_non_appointments_described", sql`${t.kind} = 'appointment' OR ${t.description} IS NOT NULL`),
    index("ix_time_claim_expiring").on(t.expiresAt).where(sql`${t.releasedAt} IS NULL AND ${t.expiresAt} IS NOT NULL`)
]);

export const appointment = pgTable("appointment", {
    id: _id(),
    timeClaimId: uuid("time_claim_id").notNull().unique().references(() => timeClaim.id),
    patientId: uuid("patient_id").notNull().references(() => patient.id),
    locationId: uuid("location_id").notNull().references(() => location.id),
    typeId: uuid("type_id").notNull().references(() => appointmentType.id),
    status: appointmentStatus("status").notNull().default("scheduled"),
    origin: appointmentOrigin("origin").notNull(),
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
});

export const appointmentTransition = pgTable("appointment_transition", {
        fromStatus: appointmentStatus("from_status").notNull(),
        toStatus: appointmentStatus("to_status").notNull(),
        actor: actorKind("actor").notNull()
    }, t => [
        primaryKey({
            name: "pk_appointment_transition",
            columns: [t.fromStatus, t.toStatus, t.actor],
        })
    ]
);

export const asapRequest = pgTable("asap_request", {
    id: _id(),
    patientId: uuid("patient_id").notNull().references(() => patient.id),
    appointmentId: uuid("appointment_id").notNull().references(() => appointment.id),
    earliestDate: date("earliest_date"),
    latestDate: date("latest_date"),
    earliestTime: time("earliest_time"),
    latestTime: time("latest_time"),
    allowedIsodow: smallint("allowed_isodow").array(), // NULL = any day
    priorityKey: timestamp("priority_key", {withTimezone: true}).notNull().defaultNow(),
    missCount: smallint("miss_count").notNull().default(0),
    state: asapState("state").notNull().default("active"),
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
}, t => [
    check('ck_allowed_isodow_valid', sql`${t.allowedIsodow} <@ ARRAY[1,2,3,4,5,6,7]::smallint[]`),
    uniqueIndex("ux_asap_one_live_per_appointment").on(t.appointmentId).where(sql`${t.state} IN ('active', 'offered')`),
    check("ck_earliest_time_lt_latest", sql`${t.earliestTime} < ${t.latestTime}`),
    check("ck_earliest_date_lte_latest", sql`${t.earliestDate} <= ${t.latestDate}`)
]);

export const slotOffer = pgTable("slot_offer", {
    id: _id(),
    asapRequestId: uuid("asap_request_id").notNull().references(() => asapRequest.id),
    timeClaimId: uuid("time_claim_id").notNull().unique().references(() => timeClaim.id),
    state: offerState("state").notNull().default("offered"),
    expiresAt: timestamp("expires_at", {withTimezone: true}).notNull(),
    respondedAt: timestamp("responded_at", {withTimezone: true}),
    createdAt: _createdAt(),
    updatedAt: _updatedAt(),
}, t => [
    uniqueIndex("ux_one_live_offer").on(t.asapRequestId).where(sql`${t.state} = 'offered'`)
]);

export const messageLog = pgTable("message_log", {
    id: _id(),
    patientId: uuid("patient_id").notNull().references(() => patient.id),
    appointmentId: uuid("appointment_id").notNull().references(() => appointment.id),
    slotOfferId: uuid("slot_offer_id").references(() => slotOffer.id),
    kind: messageKind("kind").notNull(),
    channel: messageChannel("channel").notNull(),
    body: text("body").notNull(),
    createdAt: _createdAt()
}, t => [
    unique("ux_message_once").on(t.appointmentId, t.kind, t.slotOfferId).nullsNotDistinct()
]);