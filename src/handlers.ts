import { Request, Response } from "express";
import { config } from "./config.js";

export function handlerReadiness(req: Request, res: Response) {
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("OK");
}


export function handlerMetrics(req: Request, res: Response) {
  res.set("Content-Type", "text/html; charset=utf-8");
  res.send(`
    <html>
      <body>
        <h1>Welcome, Chirpy Admin</h1>
        <p>Chirpy has been visited ${config.fileserverHits} times!</p>
      </body>
    </html>
  `);
}


export function handlerReset(req: Request, res: Response) {
  config.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("Hits reset to 0");
}


export function handlerValidateChirp(req: Request, res: Response) {
  const body = req.body.body;

  if (body.length > 140) {
    res.status(400).json({
      error: "Chirp is too long",
    });
    return;
  }

  res.status(200).json({
    valid: true,
  });
}
