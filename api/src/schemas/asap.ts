import Type from "typebox";
import {DateOnly, Instant, Nullable, TimeOfDay, Uuid} from "./common.js";
import {AsapState, OfferState} from "./enums.js";


export const AsapRequest = Type.Object({
    id: Uuid,
    appointmentId: Uuid,
    state: AsapState,
    earliestDate: Nullable(DateOnly),
    latestDate: DateOnly,
    earliestTime: Nullable(TimeOfDay),
    latestTime: Nullable(TimeOfDay),
    allowedIsoDow: Nullable(Type.Array(Type.Integer({minimum: 1, maximum: 7}))),  // sorted, deduped each 1..7; null
    missCount: Type.Integer({minimum: 0}),
    createdAt: Instant    // priority_key on the wire
});
export type AsapRequest = Type.Static<typeof AsapRequest>;

export const Offer = Type.Object({
    id: Uuid,
    asapRequestId: Uuid,
    appointmentId: Uuid,
    state: OfferState,
    slot: Type.Object({
        providerId: Uuid, start: Instant, end: Instant
    }),
    offeredAt: Instant,
    expiresAt: Instant,
    respondedAt: Nullable(Instant),
});
export type Offer = Type.Static<typeof Offer>;
