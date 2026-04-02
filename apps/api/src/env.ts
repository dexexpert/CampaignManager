import dotenv from "dotenv";

dotenv.config();

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

