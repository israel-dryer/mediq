import { pgEnum } from 'drizzle-orm/pg-core';

export const asapState = pgEnum(
    "asap_state",
    ["active", "offered", "fulfilled", "withdrawn"]
);

export const offerState = pgEnum(
    "offer_state",
    ["offered", "accepted", "declined", "expired", "revoked"]
);

export const claimKind = pgEnum(
    "claim_kind",
    ["appointment", "hold", "time_off", "admin"]
);

export const appointmentStatus = pgEnum(
    "appointment_status",
    ["scheduled", "confirmed", "arrived", "roomed", "completed", "canceled", "no_show", "bumped"]
);