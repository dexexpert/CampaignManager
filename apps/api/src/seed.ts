import { requireEnv } from "./env.js";
import { query } from "./db.js";
import bcrypt from "bcryptjs";

requireEnv();

async function main() {
  const passwordHash = await bcrypt.hash("password", 10);
  const user = await query(
    `insert into app_user(email, name, password_hash)
     values ($1, $2, $3)
     on conflict (email) do update set name = excluded.name
     returning id`,
    ["demo@example.com", "Demo User", passwordHash],
  );

  await query(
    `insert into recipient(email, name) values
      ('alice@example.com', 'Alice'),
      ('bob@example.com', 'Bob'),
      ('carol@example.com', 'Carol')
     on conflict (email) do nothing`,
  );

  const userId = user.rows[0]?.id;
  if (!userId) throw new Error("seed user not created");

  const campaign = await query(
    `insert into campaign(name, subject, body, status, created_by)
     values ($1, $2, $3, 'draft', $4)
     returning id`,
    ["Welcome Campaign", "Welcome!", "Hello there — this is a demo campaign.", userId],
  );

  const campaignId = campaign.rows[0]?.id;
  if (!campaignId) throw new Error("seed campaign not created");

  await query(
    `insert into campaign_recipient(campaign_id, recipient_id)
     select $1, id from recipient
     on conflict do nothing`,
    [campaignId],
  );

  // eslint-disable-next-line no-console
  console.log("seed complete");
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});

