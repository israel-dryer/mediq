/**
 * Execute the seed/seed.sql script to populate database with sample data.
 */
import 'dotenv/config';
import { readFile } from 'node:fs/promises'
import pg from 'pg';

const client = new pg.Client({connectionString: process.env.DATABASE_URL});
await client.connect();

try {
    const sql = await readFile(new URL('../seed/seed.sql', import.meta.url), 'utf8');
    await client.query(sql);
    console.log('seeded');
} catch (err) {
    console.error(err);
    process.exitCode = 1;
} finally {
    await client.end();
}
