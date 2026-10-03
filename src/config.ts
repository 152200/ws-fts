process.loadEnvFile();
import type { MigrationConfig } from "drizzle-orm/migrator";

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};

export function envOrThrow(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }

  return value;
}

type APIConfig = {
  fileserverHits: number;
  dbURL: string;
  port: number;
  platform: string;
  jwtSecret: string;	
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

export const config = {
  api: {
    fileserverHits: 0,
    port: Number(envOrThrow("PORT")),
    platform: envOrThrow("PLATFORM"),
    jwtSecret: envOrThrow("JWT_SECRET"),  
  },

  db: {
    url: envOrThrow("DB_URL"),
    migrationConfig,
  },
};
