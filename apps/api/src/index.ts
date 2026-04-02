import cors from "cors";
import express from "express";
import { env, requireEnv } from "./env.js";
import { authRouter } from "./auth/authRoutes.js";
import { requireAuth } from "./auth/authMiddleware.js";
import { errorMiddleware } from "./http.js";
import { campaignRouter } from "./campaigns/campaignRoutes.js";
import { recipientRouter } from "./recipients/recipientRoutes.js";

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
app.use("/campaigns", requireAuth, campaignRouter);
app.use("/recipients", requireAuth, recipientRouter);
app.use("/recipient", requireAuth, recipientRouter);

app.use(errorMiddleware);

app.listen(env.port, () => {
  console.log(`API listening on :${env.port}`);
});

