import { query } from "../db.js";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function simulateSendCampaign(campaignId: string) {
  // mark campaign sending
  await query(`update campaign set status = 'sending' where id = $1`, [campaignId]);

  const recipients = await query(
    `select recipient_id from campaign_recipient where campaign_id = $1`,
    [campaignId],
  );

  for (const r of recipients.rows as Array<{ recipient_id: string }>) {
    // small delay to feel async / progressive
    await sleep(30);

    const failed = Math.random() < 0.15;
    const sentAt = new Date();
    const opened = !failed && Math.random() < 0.35;
    const openedAt = opened ? new Date(sentAt.getTime() + Math.floor(Math.random() * 60_000)) : null;

    await query(
      `update campaign_recipient
       set status = $3,
           sent_at = $2,
           opened_at = $4
       where campaign_id = $1 and recipient_id = $5`,
      [campaignId, sentAt.toISOString(), failed ? "failed" : "sent", openedAt?.toISOString() ?? null, r.recipient_id],
    );
  }

  await query(`update campaign set status = 'sent' where id = $1`, [campaignId]);
}

