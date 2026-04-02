import { Router } from "express";
import { asyncHandler } from "../http.js";
import { query } from "../db.js";
import { createRecipientBodySchema } from "./recipientSchemas.js";

export const recipientRouter = Router();

recipientRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const result = await query(
      `select id, email, name, created_at
       from recipient
       order by created_at desc
       limit 200`,
    );
    res.json({ recipients: result.rows });
  }),
);

recipientRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const body = createRecipientBodySchema.parse(req.body);
    try {
      const result = await query(
        `insert into recipient(email, name)
         values ($1, $2)
         returning id, email, name, created_at`,
        [body.email.toLowerCase(), body.name],
      );
      res.status(201).json({ recipient: result.rows[0] });
    } catch (e: any) {
      if (e?.code === "23505") {
        return res.status(409).json({ error: "email_taken" });
      }
      throw e;
    }
  }),
);

