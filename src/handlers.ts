import { Request, Response } from "express";
import { config } from "./config.js";
import { BadRequestError, UnauthorizedError } from "./errors.js";
import { createChirp } from "./db/queries/chirps.js";
import { checkPasswordHash, validateJWT, makeJWT, 
         getBearerToken,  makeRefreshToken } from "./auth.js";
import { getUserByEmail } from "./db/queries/users.js";
import { createRefreshToken, revokeRefreshToken, 
         getUserFromRefreshToken } from "./db/queries/refreshTokens.js";

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
        <p>Chirpy has been visited ${config.api.fileserverHits} times!</p>
      </body>
    </html>
  `);
}


export async function handlerReset(req: Request, res: Response) {
  config.api.fileserverHits = 0;
  res.set("Content-Type", "text/plain; charset=utf-8");
  res.send("Hits reset to 0");
}

const profaneWords = ["kerfuffle", "sharbert", "fornax"];

export async function handlerValidateChirp(req: Request, res: Response) {

  const token = getBearerToken(req);

  const userId = validateJWT(
    token,
    config.api.jwtSecret,
  );

  const body = req.body.body;

  if (body.length > 140) {
    throw new BadRequestError(
      "Chirp is too long. Max length is 140",
    );
  }

  const words = body.split(" ");

  const cleanedWords = words.map((word: string) => {
    if (profaneWords.includes(word.toLowerCase())) {
      return "****";
    }

    return word;
  });

  const cleanedBody = cleanedWords.join(" ");

  const chirp = await createChirp({
    body: cleanedBody,
    userId,
  });

  res.status(201).json(chirp);
}

export async function handlerLogin(req: Request, res: Response) {

  const user = await getUserByEmail(req.body.email);

  if (!user) {
    res.status(401).json({
      error: "incorrect email or password",
    });
    return;
  }

  const passwordMatch = await checkPasswordHash(
    req.body.password,
    user.hashedPassword,
  );

  if (!passwordMatch) {
    res.status(401).json({
      error: "incorrect email or password",
    });
    return;
  }

   // Access token: 1 hour
  const token = makeJWT(
    user.id,
    3600,
    config.api.jwtSecret,
  );

  const refreshToken = makeRefreshToken();

  const expiresAt = new Date(
    Date.now() + 60 * 24 * 60 * 60 * 1000,
  );

  await createRefreshToken(
    refreshToken,
    user.id,
    expiresAt,
  );

  const { hashedPassword: _, ...userResponse } = user;

  res.status(200).json({
    ...userResponse,
    token,
    refreshToken,
  });
}





// ******************************************************



export async function refreshHandler(req: Request, res: Response) {

const token = getBearerToken(req);

  const refreshToken = await getUserFromRefreshToken(token);

  if (!refreshToken) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (refreshToken.revokedAt !== null) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  if (refreshToken.expiresAt <= new Date()) {
    throw new UnauthorizedError("Invalid refresh token");
  }

  const accessToken = makeJWT(
    refreshToken.userId,
    3600,
    config.api.jwtSecret,
  );

  res.status(200).json({
    token: accessToken,
  });
}

// ************************************************

export async function revokeHandler(req: Request, res: Response) {
  const token = getBearerToken(req);

  await revokeRefreshToken(token);

  res.status(204).send();
}
