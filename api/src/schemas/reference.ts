import Type from "typebox";
import {DateOnly, Instant, Nullable, TimeOfDay, Uuid} from "./common.js";

export const Location = Type.Object({
    id: Uuid,
    name: Type.String(),
    timezone: Type.String()
});
export type Location = Type.Static<typeof Location>;

export const ProviderBase = Type.Object({
    id: Uuid,
    displayName: Type.String(),
});
export type ProviderBase = Type.Static<typeof ProviderBase>;

export const TemplateBlock = Type.Object({
    locationId: Uuid,
    isodow: Type.Integer({minimum: 1, maximum: 7}),
    startsAt: TimeOfDay,
    endsAt: TimeOfDay
});
export type TemplateBlock = Type.Static<typeof TemplateBlock>;

export const ProviderStaff = Type.Object({
    ...ProviderBase.properties,
    npi: Nullable(Type.String()),
    template: Type.Optional(Type.Array(TemplateBlock))
});
export type ProviderStaff = Type.Static<typeof ProviderStaff>;

export const AppointmentType = Type.Object({
    id: Uuid,
    code: Type.String(),
    description: Type.String(),
    durationMinutes: Type.Integer({minimum: 10})
});
export type AppointmentType = Type.Static<typeof AppointmentType>;

export const AvailabilityQuery = Type.Object({
    typeId: Uuid,
    from: DateOnly,
    to: DateOnly,
    providerId: Type.Optional(Uuid)
}, {additionalProperties: false});
export type AvailabilityQuery = Type.Static<typeof AvailabilityQuery>;

export const AvailabilitySlot = Type.Object({
    providerId: Uuid,
    start: Instant
});
export type AvailabilitySlot = Type.Static<typeof AvailabilitySlot>;

export const Availability = Type.Object({
    from: DateOnly,
    to: DateOnly,
    durationMinutes: Type.Integer({minimum: 10}),
    slots: Type.Array(AvailabilitySlot)
});
export type Availability = Type.Static<typeof Availability>;