import {sql} from 'drizzle-orm';
import {
    boolean,
    char,
    check,
    date,
    interval,
    pgTable,
    smallint,
    text,
    time,
    timestamp,
    unique,
    uuid
} from 'drizzle-orm/pg-core';

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

