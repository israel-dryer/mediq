import { pgEnum } from 'drizzle-orm/pg-core';

export const asapState = pgEnum(
    "asap_state",
    ["active", "offered", "fulfilled", "withdrawn"]
);

export const offerState = pgEnum(
    "offer_state",
    ["offered", "accepted", "declined", "expired", "revoked"]
);


