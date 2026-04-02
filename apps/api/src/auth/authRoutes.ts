import { Router } from "express";
import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { asyncHandler } from "../http.js";
import { loginBodySchema, registerBodySchema } from "./authSchemas.js";
import { signAccessToken } from "./tokens.js";

export const authRouter = Router();

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const body = registerBodySchema.parse(req.body);
    const passwordHash = await bcrypt.hash(body.password, 10);

    try {
      const result = await query(
        `insert into app_user(email, name, password_hash)
         values ($1, $2, $3)
         returning id, email, name, created_at`,
        [body.email.toLowerCase(), body.name, passwordHash],
      );

      const user = result.rows[0];
      return res.status(201).json({ user });
    } catch (e: any) {
      // unique violation
      if (e?.code === "23505") {
        return res.status(409).json({ error: "email_taken" });
      }
      throw e;
    }
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const body = loginBodySchema.parse(req.body);

    const result = await query(
      `select id, email, name, password_hash
       from app_user
       where email = $1`,
      [body.email.toLowerCase()],
    );

    const row = result.rows[0] as undefined | { id: string; email: string; name: string; password_hash: string };
    if (!row) return res.status(401).json({ error: "invalid_credentials" });

    const ok = await bcrypt.compare(body.password, row.password_hash);
    if (!ok) return res.status(401).json({ error: "invalid_credentials" });

    const token = signAccessToken({ userId: row.id, email: row.email, name: row.name });
    return res.json({
      token,
      user: { id: row.id, email: row.email, name: row.name },
    });
  }),
);

