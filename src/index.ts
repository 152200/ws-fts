import express, { type Express, type Request, type Response } from 'express';
import { handlerReadiness, handlerMetrics, handlerReset, handlerValidateChirp } from './handlers.js';
import { middlewareLogResponses, middlewareMetricsInc } from './middlewares.js';

const app: Express = express();
const port = 8080;

app.use(express.json());
app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));

app.get("/api/healthz", handlerReadiness);
app.post("/api/validate_chirp", handlerValidateChirp);
app.get("/admin/metrics", handlerMetrics);
app.post("/admin/reset", handlerReset);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
