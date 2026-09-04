import Type from "typebox";
import {Nullable, TimeOfDay, Uuid} from "./common.js";

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
    template: Type.Array(TemplateBlock)
});
export type ProviderStaff = Type.Static<typeof ProviderStaff>;

export const AppointmentType = Type.Object({
    id: Uuid,
    code: Type.String(),
    description: Type.String(),
    durationMinutes: Type.Integer({minimum: 1})
});
export type AppointmentType = Type.Static<typeof AppointmentType>;
