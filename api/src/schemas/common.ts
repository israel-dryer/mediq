import Type from 'typebox';

/* TYPES */

export const Uuid = Type.String({format: 'uuid'});
export const Instant = Type.String({format: 'date-time'});
export const DateOnly = Type.String({format: 'date'});
export const TimeOfDay = Type.String({pattern: '^([01]\\d|2[0-3]):[0-5]\\d$'});
export const Nullable = <T extends Type.TSchema>(schema: T) => Type.Union([schema, Type.Null()]);


/* ERROR */

export const ErrorResponse = Type.Object({
    error: Type.Object({
        code: Type.String(),
        message: Type.String(),
        /* Only on validation failed */
        details: Type.Optional(Type.Array(Type.Object({path: Type.String(), message: Type.String()})))
    })
});
export type ErrorResponse = Type.Static<typeof ErrorResponse>;

