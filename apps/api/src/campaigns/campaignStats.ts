import { query } from "../db.js";

export type CampaignStats = {
  total: number;
  sent: number;
  failed: number;
  opened: number;
  open_rate: number;
  send_rate: number;
};

export async function getCampaignStats(campaignId: string): Promise<CampaignStats> {
  const result = await query(
    `select
       count(*)::int as total,
       count(*) filter (where status = 'sent')::int as sent,
       count(*) filter (where status = 'failed')::int as failed,
       count(*) filter (where opened_at is not null)::int as opened
     from campaign_recipient
     where campaign_id = $1`,
    [campaignId],
  );

  const row = result.rows[0] as any;
  const total = Number(row?.total ?? 0);
  const sent = Number(row?.sent ?? 0);
  const failed = Number(row?.failed ?? 0);
  const opened = Number(row?.opened ?? 0);

  const open_rate = total ? opened / total : 0;
  const send_rate = total ? (sent + failed) / total : 0;

  return { total, sent, failed, opened, open_rate, send_rate };
}

