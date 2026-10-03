import express, { type Express, type Request, type Response } from 'express';
import { handlerReadiness, handlerMetrics, 
         handlerReset, handlerValidateChirp, 
         handlerLogin, refreshHandler, revokeHandler,
	 updateUsersHandler, deleteChirpHandler,
         polkaWebhookHandler } from './handlers.js';
import { middlewareLogResponses, middlewareMetricsInc, middlewareErrorHandler } from './middlewares.js';
import { config } from "./config.js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { deleteAllUsers, createUser } from "./db/queries/users.js";
import { getChirps, getChirp } from "./db/queries/chirps.js";
import { hashPassword } from "./auth.js";

const migrationClient = postgres(config.db.url, { max: 1 });

await migrate(
  drizzle(migrationClient),
  config.db.migrationConfig,
);

const app: Express = express();
const port = config.api.port;

app.use(express.json());
app.use(middlewareLogResponses);
app.use("/app", middlewareMetricsInc);
app.use("/app", express.static("./src/app"));

app.get("/api/healthz", handlerReadiness);
app.post("/api/users", async (req: Request, res: Response) => {
  const hashedPassword = await hashPassword(req.body.password);

  const user = await createUser({
    email: req.body.email,
    hashedPassword,
  });

  const { hashedPassword: _, ...userResponse } = user;

  res.status(201).json(userResponse);
});
app.post("/api/chirps", handlerValidateChirp);
app.get("/api/chirps", async (req: Request, res: Response) => {
  let authorId = "";

  const authorIdQuery = req.query.authorId;

  if (typeof authorIdQuery === "string") {
    authorId = authorIdQuery;
  }

  let sort = "asc";

  const sortQuery = req.query.sort;

  if (typeof sortQuery === "string") {
    sort = sortQuery;
  }

  const chirps = await getChirps(authorId);

  chirps.sort((a, b) => {
    if (sort === "desc") {
      return b.createdAt.getTime() - a.createdAt.getTime();
    }

    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  res.status(200).json(chirps);
});
app.get("/api/chirps/:chirpId", async (req: Request, res: Response) => {
  const chirp = await getChirp(req.params.chirpId as string);

  if (!chirp) {
    res.status(404).json({ error: "Chirp not found" });
    return;
  }

  res.status(200).json(chirp);
});
app.post("/api/login", handlerLogin);
app.post("/api/refresh", refreshHandler);
app.post("/api/revoke", revokeHandler);
app.put("/api/users", updateUsersHandler);
app.delete("/api/chirps/:chirpId", deleteChirpHandler);
app.post("/api/polka/webhooks", polkaWebhookHandler);
app.get("/admin/metrics", handlerMetrics);
// app.post("/admin/reset", handlerReset);
app.post("/admin/reset", async (req: Request, res: Response) => {
  if (config.api.platform !== "dev") {
    res.status(403).json({
      error: "Forbidden",
    });
    return;
  }

  await deleteAllUsers();

  config.api.fileserverHits = 0;

  res.status(200).send("Reset successful");
});

app.use(middlewareErrorHandler);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
