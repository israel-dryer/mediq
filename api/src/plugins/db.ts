import fp from 'fastify-plugin';
import type { Pool } from 'pg';
import {createPool} from "../db/index.js";

export default fp(async app => {
    const pool = createPool(process.env.DATABASE_URL!);
    app.decorate('db', pool);
    app.addHook('onClose', async () => {
        await pool.end();
    });
});

declare module 'fastify' {
    interface FastifyInstance {
        db: Pool
    }
}