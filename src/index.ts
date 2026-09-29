import express, { type Express, type Request, type Response } from 'express';
import { handlerReadiness, handlerMetrics, handlerReset } from './handlers.js';
import { middlewareLogResponses, middlewareMetricsInc } from './middlewares.js';

const app: Express = express();
const port = 8080;


app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));

app.get("/healthz", handlerReadiness);
app.get("/metrics", handlerMetrics);
app.get("/reset", handlerReset);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
