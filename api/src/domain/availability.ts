import {Db} from "../db/index.js";
import {Availability} from "../schemas/reference.js";

export interface AvailabilityQuery {
    locationId: string;
    from: string;
    to: string;
    durationMinutes: number;
    providerId?: string | null;
    now?: Date | string;
}

interface AvailabilityRow {
    provider_id: string;
    start: string;
}

const AVAILABILITY_SQL = `
    select provider_id, start
    from
        availability(
                $1::uuid,
                $2::date,
                $3::date,
                make_interval(mins => $4::int),
                $5::uuid,
                coalesce($6::timestamptz, now())
        )
    order by start, provider_id
`;

export async function queryAvailability(db: Db, q: AvailabilityQuery): Promise<AvailabilityRow[]> {
    const {rows} = await db.query<AvailabilityRow>(AVAILABILITY_SQL, [
        q.locationId,
        q.from,
        q.to,
        q.durationMinutes,
        q.providerId ?? null,
        q.now ?? null
    ]);
    return rows;
}

export interface AvailabilityRequest {
    locationId: string;
    typeId: string;
    from: string;
    to: string;
    providerId?: string;
}

export class NotFound extends Error {
    constructor(public readonly what: string) {
        super(`${what} not found`);
    }
}

export async function getAvailability(db: Db, req: AvailabilityRequest): Promise<Availability> {
    const type = await db.query<{ duration_minutes: number }>(
        `select (extract(epoch from duration) / 60)::int as duration_minutes from appointment_type where id = $1`,
        [req.typeId]);
    const durationMinutes = type.rows[0]?.duration_minutes;
    if (durationMinutes === undefined) throw new NotFound('appointment_type');

    const rows = await queryAvailability(db, {
        locationId: req.locationId,
        from: req.from,
        to: req.to,
        durationMinutes,
        providerId: req.providerId,
    });

    return {
        from: req.from,
        to: req.to,
        durationMinutes,
        slots: rows.map(r => ({providerId: r.provider_id, start: r.start}))
    }
}