import { Pool } from "pg";
import { env } from "./env.js";

export const pool = new Pool({
  connectionString: env.databaseUrl,
});

export async function query(text: string, params?: unknown[]) {
  return pool.query(text, params);
}

