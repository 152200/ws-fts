import { db } from "../index.js";
import { asc, eq } from "drizzle-orm";
import { NewChirp, chirps } from "../schema.js";

export async function createChirp(chirp: NewChirp) {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .returning();

  return result;
}


export async function getChirps() {
  return await db
    .select()
    .from(chirps)
    .orderBy(asc(chirps.createdAt));
}


export async function getChirp(id: string) {
  const [result] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, id));

  return result;
}
