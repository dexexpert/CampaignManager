import { Router } from "express";
import { asyncHandler } from "../http.js";
import { query } from "../db.js";
import { pool } from "../db.js";
import type { AuthedRequest } from "../auth/authMiddleware.js";
import {
  createCampaignBodySchema,
  scheduleCampaignBodySchema,
  updateCampaignBodySchema,
} from "./campaignSchemas.js";
import { getCampaignStats } from "./campaignStats.js";
import { simulateSendCampaign } from "./sendSimulation.js";
import { assertDraft, assertNotSentOrSending, parseAndValidateFutureIsoDatetime, type CampaignStatus } from "./rules.js";

export const campaignRouter = Router();

campaignRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const result = await query(
      `select id, name, subject, status, scheduled_at, created_at, updated_at
       from campaign
       where created_by = $1
       order by created_at desc
       limit 50`,
      [userId],
    );
    res.json({ campaigns: result.rows });
  }),
);

campaignRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const body = createCampaignBodySchema.parse(req.body);

    const client = await pool.connect();
    try {
      await client.query("begin");

      const campaign = await client.query(
        `insert into campaign(name, subject, body, status, created_by)
         values ($1, $2, $3, 'draft', $4)
         returning id, name, subject, body, status, scheduled_at, created_by, created_at, updated_at`,
        [body.name, body.subject, body.body, userId],
      );
      const campaignRow = campaign.rows[0];

      const emails = Array.from(new Set(body.recipientEmails.map((e) => e.toLowerCase().trim())));

      // create recipients (name defaults to local-part for convenience)
      for (const email of emails) {
        const defaultName = email.split("@")[0] || email;
        await client.query(
          `insert into recipient(email, name)
           values ($1, $2)
           on conflict (email) do nothing`,
          [email, defaultName],
        );
      }

      // attach recipients to campaign
      await client.query(
        `insert into campaign_recipient(campaign_id, recipient_id)
         select $1, r.id
         from recipient r
         where r.email = any($2::text[])
         on conflict do nothing`,
        [campaignRow.id, emails],
      );

      await client.query("commit");
      res.status(201).json({ campaign: campaignRow });
    } catch (e) {
      await client.query("rollback");
      throw e;
    } finally {
      client.release();
    }
  }),
);

campaignRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const id = String(req.params.id);

    const campaign = await query(
      `select id, name, subject, body, status, scheduled_at, created_by, created_at, updated_at
       from campaign
       where id = $1 and created_by = $2`,
      [id, userId],
    );
    if (!campaign.rowCount) return res.status(404).json({ error: "not_found" });

    const recipients = await query(
      `select
         r.id,
         r.email,
         r.name,
         cr.status,
         cr.sent_at,
         cr.opened_at
       from campaign_recipient cr
       join recipient r on r.id = cr.recipient_id
       where cr.campaign_id = $1
       order by r.email asc`,
      [id],
    );

    const stats = await getCampaignStats(id);
    res.json({ campaign: campaign.rows[0], recipients: recipients.rows, stats });
  }),
);

campaignRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const id = String(req.params.id);
    const body = updateCampaignBodySchema.parse(req.body);

    const current = await query(`select status from campaign where id = $1 and created_by = $2`, [id, userId]);
    if (!current.rowCount) return res.status(404).json({ error: "not_found" });
    const status = (current.rows[0] as any).status as CampaignStatus;
    try {
      assertDraft(status, "campaign_not_editable");
    } catch (e: any) {
      return res.status(e.statusCode ?? 409).json({ error: e.message });
    }

    const result = await query(
      `update campaign
       set
         name = coalesce($3, name),
         subject = coalesce($4, subject),
         body = coalesce($5, body)
       where id = $1 and created_by = $2
       returning id, name, subject, body, status, scheduled_at, created_by, created_at, updated_at`,
      [id, userId, body.name ?? null, body.subject ?? null, body.body ?? null],
    );
    res.json({ campaign: result.rows[0] });
  }),
);

campaignRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const id = String(req.params.id);

    const current = await query(`select status from campaign where id = $1 and created_by = $2`, [id, userId]);
    if (!current.rowCount) return res.status(404).json({ error: "not_found" });
    const status = (current.rows[0] as any).status as CampaignStatus;
    try {
      assertDraft(status, "campaign_not_deletable");
    } catch (e: any) {
      return res.status(e.statusCode ?? 409).json({ error: e.message });
    }

    await query(`delete from campaign where id = $1 and created_by = $2`, [id, userId]);
    res.status(204).send();
  }),
);

campaignRouter.post(
  "/:id/schedule",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const id = String(req.params.id);
    const body = scheduleCampaignBodySchema.parse(req.body);

    let scheduledAt: Date;
    try {
      scheduledAt = parseAndValidateFutureIsoDatetime(body.scheduledAt);
    } catch (e: any) {
      return res.status(e.statusCode ?? 400).json({ error: e.message });
    }

    const current = await query(`select status from campaign where id = $1 and created_by = $2`, [id, userId]);
    if (!current.rowCount) return res.status(404).json({ error: "not_found" });
    const status = (current.rows[0] as any).status as CampaignStatus;
    try {
      assertDraft(status, "campaign_not_schedulable");
    } catch (e: any) {
      return res.status(e.statusCode ?? 409).json({ error: e.message });
    }

    const result = await query(
      `update campaign
       set status = 'scheduled', scheduled_at = $3
       where id = $1 and created_by = $2
       returning id, status, scheduled_at, updated_at`,
      [id, userId, scheduledAt.toISOString()],
    );
    res.json({ campaign: result.rows[0] });
  }),
);

campaignRouter.post(
  "/:id/send",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const id = String(req.params.id);

    const current = await query(`select status from campaign where id = $1 and created_by = $2`, [id, userId]);
    if (!current.rowCount) return res.status(404).json({ error: "not_found" });
    const status = (current.rows[0] as any).status as CampaignStatus;

    try {
      assertNotSentOrSending(status);
    } catch (e: any) {
      return res.status(e.statusCode ?? 409).json({ error: e.message });
    }

    // kick off async simulation
    setTimeout(() => {
      simulateSendCampaign(id).catch((e) => console.error(e));
    }, 0);

    res.status(202).json({ ok: true });
  }),
);

campaignRouter.get(
  "/:id/stats",
  asyncHandler(async (req, res) => {
    const userId = (req as AuthedRequest).user.userId;
    const id = String(req.params.id);

    const exists = await query(`select 1 from campaign where id = $1 and created_by = $2`, [id, userId]);
    if (!exists.rowCount) return res.status(404).json({ error: "not_found" });

    const stats = await getCampaignStats(id);
    res.json(stats);
  }),
);

