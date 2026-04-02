-- Core schema for Mini Campaign Manager

create extension if not exists pgcrypto;

create table if not exists app_user (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create type campaign_status as enum ('draft', 'scheduled', 'sending', 'sent');

create table if not exists campaign (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  subject text not null,
  body text not null,
  status campaign_status not null default 'draft',
  scheduled_at timestamptz null,
  created_by uuid not null references app_user(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaign_created_by_idx on campaign(created_by);
create index if not exists campaign_status_idx on campaign(status);
create index if not exists campaign_created_at_idx on campaign(created_at desc);

create table if not exists recipient (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create type campaign_recipient_status as enum ('pending', 'sent', 'failed');

create table if not exists campaign_recipient (
  campaign_id uuid not null references campaign(id) on delete cascade,
  recipient_id uuid not null references recipient(id) on delete cascade,
  status campaign_recipient_status not null default 'pending',
  sent_at timestamptz null,
  opened_at timestamptz null,
  primary key (campaign_id, recipient_id)
);

create index if not exists campaign_recipient_campaign_idx on campaign_recipient(campaign_id);
create index if not exists campaign_recipient_recipient_idx on campaign_recipient(recipient_id);
create index if not exists campaign_recipient_status_idx on campaign_recipient(status);

-- Auto-update updated_at on campaign rows
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists campaign_set_updated_at on campaign;
create trigger campaign_set_updated_at
before update on campaign
for each row execute function set_updated_at();

