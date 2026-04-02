create table if not exists migrations (
  id serial primary key,
  filename text not null unique,
  applied_at timestamptz not null default now()
);

