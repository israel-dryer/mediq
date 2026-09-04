import Type from 'typebox';
import {Instant, Nullable, Uuid} from "./common.js";
import {ClaimKind, MessageChannel, MessageKind} from "./enums.js";

export const Message = Type.Object({
    id: Uuid,
    appointmentId: Nullable(Uuid),
    slotOfferId: Nullable(Uuid),
    kind: MessageKind,
    channel: MessageChannel,
    body: Type.String(),
    createdAt: Instant
});
export type Message = Type.Static<typeof Message>;

export const ClaimBlock = Type.Object({
    id: Uuid,
    providerId: Uuid,
    kind: ClaimKind,
    start: Instant,
    end: Instant,
    description: Type.String()
});
export type ClaimBlock = Type.Static<typeof ClaimBlock>;