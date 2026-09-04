import 'dotenv/config';
import {readdir, readFile} from 'node:fs/promises';
import {join} from 'node:path';
import pg from 'pg';

const dir = './migrations';
const client = new pg.Client({connectionString: process.env.DATABASE_URL});
await client.connect();

try {
    await client.query(`
        create table if not exists schema_migrations (
        name text primary key,
        applied_at timestamptz not null default now()    
        )
    `);
    const applied = new Set(
        (await client.query('select name from schema_migrations')).rows.map(r => r.name)
    );
    const files = (await readdir(dir)).filter(f => f.endsWith('.sql')).sort();

    for (const name of files) {
        if (applied.has(name)) continue;
        const sqlText = await readFile(join(dir, name), 'utf8');
        const body = sqlText.split('\n').filter((l) => !l.trim().startsWith('--')).join('\n').trim();
        // DO NOT PROCESS EMPTY OR STAGED FILES
        if (body === '') {
            console.log(`skipped ${name} (empty)`);
            continue;
        }
        await client.query('begin');
        try {
            await client.query(sqlText);
            await client.query('insert into schema_migrations (name) values ($1)', [name]);
            await client.query('commit');
            console.log(`applied ${name}`);
        } catch (e) {
            await client.query('rollback');
            throw new Error(`${name} failed: ${e.message}`, {cause: e});
        }
    }
    console.log('up to date');
} catch (e) {
    console.error(e.message);
    process.exitCode = 1;
} finally {
    await client.end();
}