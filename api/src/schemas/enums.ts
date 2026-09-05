import Type from "typebox";


export const AppointmentStatus = Type.Enum([
    'scheduled', 'confirmed', 'arrived', 'roomed', 'completed', 'canceled', 'no_show', 'bumped'
]);
export const AppointmentOrigin = Type.Enum(['patient', 'staff']);
export const AsapState = Type.Enum(['active', 'offered', 'fulfilled', 'withdrawn']);
export const OfferState = Type.Enum(['offered', 'accepted', 'declined', 'expired']);
export const ActorKind = Type.Enum(['patient', 'staff', 'system']);
export const MessageKind = Type.Enum([
    'booking_confirmation', 'reminder_7d', 'reminder_1d', 'cancellation_confirmation', 'asap_offer',
    'asap_offer_expired', 'asap_withdrawn', 'reschedule_confirmation'
]);
export const MessageChannel = Type.Enum(['sms', 'email']);
export const ClaimKind = Type.Enum(['appointment', 'hold', 'time_off', 'admin']);
export const EventKind = Type.Enum(['created', 'status', 'moved']);
export const Action = Type.Enum([
    'confirm', 'cancel', 'check_in', 'join_asap', 'arrive', 'room', 'complete', 'no_show', 'bump', 'move', 'rebook'
]);


export type AppointmentStatus = Type.Static<typeof AppointmentStatus>;
export type AppointmentOrigin = Type.Static<typeof AppointmentOrigin>;
export type AsapState = Type.Static<typeof AsapState>;
export type OfferState = Type.Static<typeof OfferState>;
export type ActorKind = Type.Static<typeof ActorKind>;
export type MessageKind = Type.Static<typeof MessageKind>;
export type MessageChannel = Type.Static<typeof MessageChannel>;
export type ClaimKind = Type.Static<typeof ClaimKind>;
export type EventKind = Type.Static<typeof EventKind>;
export type Action = Type.Static<typeof Action>;

