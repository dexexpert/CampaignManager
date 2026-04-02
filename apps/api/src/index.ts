import cors from "cors";
import express from "express";
import { env, requireEnv } from "./env.js";
import { authRouter } from "./auth/authRoutes.js";
import { errorMiddleware } from "./http.js";

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

app.use("/auth", authRouter);

app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});

