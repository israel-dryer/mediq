import 'dotenv/config';
import Fastify from 'fastify';

const app = Fastify({logger: true});
app.get('/health', async () => ({ok: true}));
app.listen({port: 3000});