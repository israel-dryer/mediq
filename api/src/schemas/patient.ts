import Type from "typebox";
import {DateOnly, Nullable, Uuid} from "./common.js";

export const PatientSummary = Type.Object({
    id: Uuid,
    mrn: Type.String(),
    lastName: Type.String(),
    firstName: Type.String(),
    dob: Nullable(DateOnly),
    phone: Nullable(Type.String()),
    email: Nullable(Type.String()),
});
export type PatientSummary = Type.Static<typeof PatientSummary>;

export const PatientRef = Type.Object({
    id: Uuid,
    mrn: Type.String(),
    lastName: Type.String(),
    firstName: Type.String(),
});
export type PatientRef = Type.Static<typeof PatientRef>;