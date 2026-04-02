import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireEnv } from "./env.js";
import { pool } from "./db.js";

requireEnv();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, "migrations");

async function main() {
  const client = await pool.connect();
  try {
    await client.query("begin");
    const files = (await readdir(migrationsDir))
      .filter((f) => f.endsWith(".sql"))
      .sort((a, b) => a.localeCompare(b));

    for (const filename of files) {
      const already = await client.query<{ filename: string }>(
        "select filename from migrations where filename = $1",
        [filename],
      );
      if (already.rowCount) continue;

      const sql = await readFile(path.join(migrationsDir, filename), "utf8");
      await client.query(sql);
      await client.query("insert into migrations(filename) values ($1)", [filename]);
      // eslint-disable-next-line no-console
      console.log(`applied ${filename}`);
    }
    await client.query("commit");
  } catch (e) {
    await client.query("rollback");
    throw e;
  } finally {
    client.release();
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

