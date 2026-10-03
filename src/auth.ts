import argon2 from "argon2";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import type { Request } from "express";
import { randomBytes } from "node:crypto";
import { UnauthorizedError } from "./errors.js";

type ChirpyJwtPayload = Pick<
  JwtPayload,
  "iss" | "sub" | "iat" | "exp"
>;

export async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password);
}

export async function checkPasswordHash(
  password: string,
  hash: string,
): Promise<boolean> {
  return await argon2.verify(hash, password);
}


export function makeJWT(
  userID: string,
  expiresIn: number,
  secret: string,
): string {
  const iat = Math.floor(Date.now() / 1000);

  const payload: ChirpyJwtPayload = {
    iss: "chirpy",
    sub: userID,
    iat,
    exp: iat + expiresIn,
  };

  return jwt.sign(payload, secret);
}

export function validateJWT(
  tokenString: string,
  secret: string,
): string {
  try {
    const decoded = jwt.verify(tokenString, secret);

    if (typeof decoded === "string" || !decoded.sub) {
      throw new Error("Invalid token");
    }

    return decoded.sub;
  } catch {
    throw new UnauthorizedError("Invalid token");
  }
}

export function getBearerToken(req: Request): string {
  const authHeader = req.get("Authorization");

  if (!authHeader) {
    throw new Error("Missing Authorization header");
  }

  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    throw new Error("Invalid Authorization header");
  }

  return token;
}

export function makeRefreshToken(): string {
  return randomBytes(32).toString("hex");
}
