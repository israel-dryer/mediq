import {sql} from 'drizzle-orm';
import {
    boolean,
    char,
    check,
    date,
    index,
    interval,
    pgTable,
    smallint,
    text,
    time,
    timestamp,
    unique,
    uuid,
} from 'drizzle-orm/pg-core';
import {tstzrange} from "./types.js";
import {claimKind} from "./enums.js";

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