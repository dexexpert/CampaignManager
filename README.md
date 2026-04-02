# Mini Campaign Manager

Full-stack Mini Campaign Manager (email campaign creation + tracking simulation) built as a Yarn workspaces monorepo:

- `apps/api`: Node.js + Express + PostgreSQL (raw SQL via `pg`) + JWT auth + Zod validation
- `apps/web`: React + TypeScript (Vite) + Redux Toolkit + React Query

## Quickstart

### 1) Install deps

```bash
yarn
```

### 2) Start Postgres (Docker)

```bash
docker compose up -d
```

### 3) Configure env

Copy the examples:

- `.env.example` → `.env`
- `apps/web/.env.example` → `apps/web/.env`

### 4) Run migrations + seed

```bash
yarn workspace api migrate
yarn workspace api seed
```

### 5) Run the apps

```bash
yarn dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000/health`

## Demo flow

1. Login at `/login`
   - Seeded user: `demo@example.com` / `password`
2. Create a campaign at `/campaigns/new`
3. Open it and click **Schedule** or **Send**
4. Watch the recipients update (send simulation marks each recipient `sent` or `failed` randomly, and may set `opened_at`)

## API overview

### Auth

- `POST /auth/register`
- `POST /auth/login` → returns `{ token, user }`

Send the token as:

`Authorization: Bearer <token>`

### Campaigns (auth required)

- `GET /campaigns`
- `POST /campaigns`
- `GET /campaigns/:id` (includes recipients + stats)
- `PATCH /campaigns/:id` (**draft-only**)
- `DELETE /campaigns/:id` (**draft-only**)
- `POST /campaigns/:id/schedule` (**draft-only**, future-only `scheduledAt`)
- `POST /campaigns/:id/send` (async simulation; cannot re-send once `sent`)
- `GET /campaigns/:id/stats`

### Recipients (auth required)

- `GET /recipients`
- `POST /recipient` (also accepts `POST /recipients`)

## Business rules enforced server-side

- **Draft-only edits/deletes**: campaigns can only be updated/deleted when `status = draft`
- **Future scheduling**: `scheduled_at` must be in the future
- **Irreversible send**: sending transitions to `sending` → `sent` and cannot be undone/repeated
- **Stats shape**:

```json
{ "total": 0, "sent": 0, "failed": 0, "opened": 0, "open_rate": 0, "send_rate": 0 }
```

## Tests

```bash
yarn test
```

Includes 3 unit tests covering critical campaign business rules.

## Schema + indexing notes

Key indexes included in `apps/api/src/migrations/0001_init.sql`:

- `campaign(created_by)`: list campaigns per user quickly (`GET /campaigns`)
- `campaign(status)`: common filtering/logic on state transitions
- `campaign(created_at desc)`: fast recent-first sorting
- `campaign_recipient(campaign_id)` and `(recipient_id)`: join + detail queries
- `campaign_recipient(status)`: aggregate counts by status efficiently for stats

## How I Used Claude Code

I used an AI coding assistant as a *pair programmer* for speed, but kept tight control of API design, business rules, and testing.

### 1) What I delegated

- Initial pass on **PostgreSQL schema** + suggested indexes
- Scaffolding **Express route layout** and Zod validation shapes
- Drafting a first version of **React pages** and wiring React Query hooks

### 2) Example prompts I used

- “Design a Postgres schema for User/Campaign/Recipient/CampaignRecipient, propose indexes, and explain trade-offs.”
- “Generate Express route handlers for campaigns with draft-only edits, future-only scheduling, and a send simulation.”
- “Create a React + TS UI with React Query and Redux auth that matches these 4 pages and UI features.”

### 3) Where it was wrong / needed correction

- It initially produced a Unix-only test script (`NODE_OPTIONS=... jest`) which breaks on Windows; I changed it to a Node invocation that works cross-platform.
- It suggested patterns that depended on Docker being available at runtime; I ensured the **core business rules** are testable without requiring a running DB.

### 4) What I would not let it do (and why)

- **Auth/security decisions** (token storage strategy, error messages, password handling): these require careful review and threat modeling.
- **Database migrations without review**: a small SQL mistake can corrupt data or cause hard-to-debug production issues.
- **Large refactors unreviewed**: AI can be confident-but-wrong; I kept changes in small commits so diffs stay auditable.

