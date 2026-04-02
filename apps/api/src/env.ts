import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Try local `.env` first (cwd), then fall back to monorepo root `.env`.
dotenv.config();
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const candidates = [
    // apps/api/.env (common when running from workspace root)
    path.resolve(__dirname, "../.env"),
    // monorepo root .env
    path.resolve(__dirname, "../../../.env"),
  ];
  for (const p of candidates) {
    dotenv.config({ path: p, override: false });
    if (process.env.DATABASE_URL && process.env.JWT_SECRET) break;
  }
}

export const env = {
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "",
  port: Number(process.env.PORT ?? "4000"),
  webOrigin: process.env.WEB_ORIGIN ?? "http://localhost:5173",
};

export function requireEnv() {
  const missing: string[] = [];
  if (!env.databaseUrl) missing.push("DATABASE_URL");
  if (!env.jwtSecret) missing.push("JWT_SECRET");
  if (missing.length) {
    throw new Error(`Missing required env vars: ${missing.join(", ")}`);
  }
}

