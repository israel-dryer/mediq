import Type from 'typebox';
import {Nullable, Uuid} from "./common.js";
import {PatientSummary} from "./patient.js";

export const PersonasResponse = Type.Object({
    staff: Type.Object({displayName: Type.String()}),
    patients: Type.Array(Type.Object({
        patientId: Uuid,
        displayName: Type.String(),
        mrn: Type.String(),
        hint: Type.String(),
    })),
});
export type PersonasResponse = Type.Static<typeof PersonasResponse>;

export const Actor = Type.Union([
    Type.Object({kind: Type.Literal('staff')}),
    Type.Object({kind: Type.Literal('patient'), patientId: Uuid}),
]);
export type Actor = Type.Static<typeof Actor>;

export const SessionBody = Type.Union([
        Type.Object({persona: Type.Literal('staff')}, {additionalProperties: false}),
        Type.Object({persona: Type.Literal('patient'), patientId: Uuid}, {additionalProperties: false})
    ]
);
export type SessionBody = Type.Static<typeof SessionBody>;

export const SessionResponse = Type.Object({
    actor: Actor,
    patient: Type.Optional(PatientSummary)
});
export type SessionResponse = Type.Static<typeof SessionResponse>;

export const CurrentSessionResponse = Type.Object({
    actor: Nullable(Actor)
});
export type CurrentSessionResponse = Type.Static<typeof CurrentSessionResponse>;
