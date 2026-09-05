import pg from 'pg';
import {ActorKind} from "../schemas/enums.js";

// timestampz (1184) and timestamp (1114): keep the ISO string Postgres sent
pg.types.setTypeParser(1184, s => s);
pg.types.setTypeParser(1114, s => s);

export type Db = pg.Pool | pg.PoolClient;

export function createPool(connectionString: string) {
    return new pg.Pool({connectionString});
}

export async function withActor<T>(pool: pg.Pool, actor: ActorKind, fn: (tx: pg.PoolClient) => Promise<T>) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query("select set_config('mediq.actor', $1, true)", [actor]);
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}