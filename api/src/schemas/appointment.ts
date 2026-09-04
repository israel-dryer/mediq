import Type from "typebox";
import {Instant, Nullable, Uuid} from "./common.js";
import {Action, ActorKind, AppointmentOrigin, AppointmentStatus, EventKind} from "./enums.js";
import {AppointmentType, ProviderBase} from "./reference.js";
import {AsapRequest, Offer} from "./asap.js";
import {Message} from "./message.js";
import {PatientRef} from "./patient.js";
import {IntakeConfirmed} from "./intake.js";

export const AppointmentCore = Type.Object({
    id: Uuid,
    status: AppointmentStatus,
    origin: AppointmentOrigin,
    start: Instant,
    end: Instant,
    provider: ProviderBase,
    type: AppointmentType,
    locationId: Uuid,
    actions: Type.Array(Action),
    createdAt: Instant,
});
export type AppointmentCore = Type.Static<typeof AppointmentCore>;

export const AsapRequestStaff = Type.Object({
    ...AsapRequest.properties,
    patient: PatientRef,
    appointment: AppointmentCore,  // the one being improved
    offers: Type.Array(Offer)      // all, newest first
});
export type AsapRequestStaff = Type.Static<typeof AsapRequestStaff>;

export const AppointmentEvent = Type.Object({
    id: Uuid,
    at: Instant,
    actor: ActorKind,
    kind: EventKind,
    fromStatus: Nullable(AppointmentStatus),
    toStatus: Nullable(AppointmentStatus),
    fromClaimId: Nullable(Uuid),
    toClaimId: Nullable(Uuid),
    detail: Type.Unknown()
});
export type AppointmentEvent = Type.Static<typeof AppointmentEvent>;

export const AppointmentPatientView = Type.Object({
    ...AppointmentCore.properties,
    asapRequest: Nullable(AsapRequest),
    offer: Nullable(Offer),
    messages: Type.Array(Message)
});
export type AppointmentPatientView = Type.Static<typeof AppointmentPatientView>;

export const AppointmentBoardRow = Type.Object({
    ...AppointmentCore.properties,
    patient: PatientRef,
    intakeConfirmed: Type.Boolean(),
});
export type AppointmentBoardRow = Type.Static<typeof AppointmentBoardRow>;

export const AppointmentStaffView = Type.Object({
    ...AppointmentBoardRow.properties,
    intake: Nullable(IntakeConfirmed),
    asapRequest: Nullable(AsapRequestStaff),
    messages: Type.Array(Message),
    history: Type.Array(AppointmentEvent)
});
export type AppointmentStaffView = Type.Static<typeof AppointmentStaffView>;

