import 'dotenv/config';
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    dialect: 'postgresql',
    schema: ['./src/db/schema.ts', './src/db/enums.ts'],
    out: './migrations/',
    dbCredentials: { url: process.env.DATABASE_URL! }
})