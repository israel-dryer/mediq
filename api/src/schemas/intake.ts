import Type from 'typebox';
import {Instant} from "./common.js";

export const IntakeFields = Type.Object({
    reasonForVisit: Type.String({minLength: 1, maxLength: 300}),
    symptoms: Type.Array(Type.String()),
    onset: Type.String(),
    medications: Type.Array(Type.String()),
    allergies: Type.Array(Type.String()),
    notes: Type.String()
});
export type IntakeFields = Type.Static<typeof IntakeFields>;

export const IntakeConfirmed = Type.Object({
    ...IntakeFields.properties,
    confirmedAt: Instant
});
export type IntakeConfirmed = Type.Static<typeof IntakeConfirmed>;