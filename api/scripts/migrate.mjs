import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
    await migrate(drizzle(pool), { migrationsFolder: './migrations' });
    console.log('migrations applied');
} catch (e) {
    console.error(e);
    process.exitCode = 1;
}
await pool.end();