import { defineConfig } from "drizzle-kit";
import { envOrThrow } from "./src/config.js";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: envOrThrow("DB_URL"),
  },
});
