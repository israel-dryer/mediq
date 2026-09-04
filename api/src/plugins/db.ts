import fp from 'fastify-plugin';
import pg from 'pg';
import {drizzle} from 'drizzle-orm/node-postgres';
import * as schema from '../db/schema.js';

export default fp(async app => {
    const pool = new pg.Pool({connectionString: process.env.DATABASE_URL});
    const db = drizzle(pool, {schema});

    app.decorate('db', db);
    app.addHook('onClose', async () => {
        await pool.end();
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        db: ReturnType<typeof drizzle<typeof schema>>;
    }
}