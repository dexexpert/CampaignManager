import cors from "cors";
import express from "express";
import { env, requireEnv } from "./env.js";

requireEnv();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: env.webOrigin,
    credentials: true,
  }),
);

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "internal_error" });
});

app.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});

