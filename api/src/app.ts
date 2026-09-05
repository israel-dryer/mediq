import Fastify from "fastify";
import dbPlugin from "./plugins/db.js";
import type { TypeBoxTypeProvider } from '@fastify/type-provider-typebox';

export async function buildApp() {
    const app = Fastify({logger: true}).withTypeProvider<TypeBoxTypeProvider>();
    await app.register(dbPlugin);
    app.get('/health', async () => ({ok: true}));
    return app;
}