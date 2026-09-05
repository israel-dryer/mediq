import 'dotenv/config';
import {buildApp} from "./app.js";

const app = await buildApp();
void app.listen({port: 3000});
