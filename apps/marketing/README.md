# @revendiste/marketing

Local marketing studio for Revendiste: **briefs** → **renders** (Remotion, Satori, Higgsfield) → optional **Meta / TikTok** campaign creation (always **PAUSED** / **DISABLED** until you unpause in Ads Manager). **Not deployed as a service** — runs on your machine with Docker.

## Prerequisites

- Docker
- Node 20+ and pnpm (repo root)
- Optional: `higgsfield` CLI for AI video ([Higgsfield install](https://github.com/higgsfield-ai/cli))

## Quick start

```bash
cd apps/marketing
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open **http://127.0.0.1:4001** — sidebar by strategy (**Resumen**, **Kinetic Type**, **IA generativa**, **UGC**, **Carruseles**, **Renders**). Queue Remotion renders from briefs; click a finished render to preview the MP4 (presigned URL from MinIO).

### Infra defaults

| Service  | Port |
| -------- | ---- |
| Postgres | 5544 |
| Redis    | 6479 |
| MinIO    | 9000 |

## Core workflows

### 1. Briefs & Remotion (Kinetic / Spritz)

1. Seed briefs: `seeds/briefs/*.json` → `pnpm db:seed`
2. In the UI, open **Kinetic Type** (or **Resumen**), click **Render Remotion** on a brief.
3. Requires **Redis** (BullMQ) + worker in `pnpm dev`. Output: `output/{renderId}.mp4` + optional upload to MinIO (`assetUrls.mp4Key`).

### 2. CapCut / external MP4 → campaigns

1. Drop your MP4 on disk (e.g. `output/my-edit.mp4`).
2. Seed includes brief **`cli-publish`** — CLI can create a render row pointing at your file (see **CLI** below).
3. Use **MCP + Claude Code** ([`AGENT_PROMPT.md`](./AGENT_PROMPT.md)) for dry-run → confirm → `publish_meta` / `publish_tiktok`, **or** use `pnpm publish` with `--dry-run` first.

### 3. MCP (Claude Code CLI)

```bash
cd apps/marketing
pnpm mcp   # stdio MCP server — register this command in Claude Code MCP settings
```

Tools include: `render_list`, `render_preview`, `event_lookup` (needs `MAIN_DATABASE_URL`), `audience_suggest`, `utm_build`, `campaign_plan`, `publish_meta`, `publish_tiktok`, `campaign_list`, `publish_log_tail`.

Always follow **`AGENT_PROMPT.md`**: dry-run first, wait for **confirmar**, then `dryRun: false`.

### 4. CLI publishing

Unified flow (creates **full** PAUSED Meta / TikTok structure — not legacy creative-only):

```bash
pnpm publish -- \
  --platform meta \
  --file ./output/my-edit.mp4 \
  --budget 5 \
  --objective traffic \
  --campaign-slug revendiste-mvd \
  --dry-run

pnpm publish -- \
  --platform tiktok \
  --render-id <uuid> \
  --budget 5 \
  --objective traffic \
  --confirm
```

- **`--file`**: creates a new `renders` row under brief `cli-publish` with `params.localFilePath`.
- **`--render-id`**: use an existing render; resolves video from `params.localFilePath` or `output/{id}.mp4`.
- **`--dry-run`**: plan only (no Ads API writes). Live calls require **`--confirm`**.
- **`--legacy-creative-only`**: old Meta behaviour (upload + single ad creative, no campaign stack).

Environment shortcuts: `MARKETING_CAMPAIGN_NAME`, `MARKETING_CAMPAIGN_SLUG`, `MARKETING_PRIMARY_TEXT`.

### 5. Tracking (monorepo)

- **UTMs**: built in code (`src/publishers/utm.ts`) — default landing `https://revendiste.com/` with `utm_source`, `utm_medium=paid_social`, etc.
- **Frontend**: `apps/frontend/src/lib/analytics/track.ts` captures UTMs once per session and forwards selected conversion events to the **backend** (`/api/marketing/tracking/meta-capi`, `/api/marketing/tracking/tiktok-events`) when not `VITE_APP_ENV=local`.
- **GTM**: Meta Pixel + TikTok Pixel remain configured in the GTM container; server endpoints add **CAPI / Events API** redundancy.

Set backend env: `META_PIXEL_ID`, `META_CAPI_TOKEN` (or reuse `META_ACCESS_TOKEN`), `TIKTOK_PIXEL_CODE`, `TIKTOK_ACCESS_TOKEN`.

## Useful commands

| Command                | Description                                     |
| ---------------------- | ----------------------------------------------- |
| `pnpm dev`             | Express + Vite UI on `:4001`                    |
| `pnpm mcp`             | MCP stdio server for Claude Code                |
| `pnpm remotion:studio` | Remotion Studio                                 |
| `pnpm render:spritz`   | CLI render Spritz → `output/spritz-preview.mp4` |
| `pnpm carousel`        | Satori carousels → `output/carousel-*`          |
| `pnpm generate-ad`     | Spritz pipeline + DB / MinIO                    |
| `pnpm publish -- ...`  | Meta / TikTok unified publisher                 |
| `pnpm capture`         | Playwright flows (`FRONTEND_URL`)               |
| `pnpm db:reset`        | Truncate data tables + re-seed                  |

## Environment

See [.env.example](./.env.example).

**Marketing DB** is separate from the main app (`MARKETING_DATABASE_URL`).

### Meta

| Variable             | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `META_ACCESS_TOKEN`  | System user token with `ads_management`      |
| `META_AD_ACCOUNT_ID` | Must include `act_` prefix                   |
| `META_PAGE_ID`       | Page attached to the ad account              |
| `META_PIXEL_ID`      | Used in ad set `promoted_object` for traffic |

### TikTok

| Variable                                            | Purpose                                       |
| --------------------------------------------------- | --------------------------------------------- |
| `TIKTOK_ACCESS_TOKEN`                               | Marketing API token                           |
| `TIKTOK_ADVERTISER_ID`                              | Advertiser id                                 |
| `TIKTOK_IDENTITY_ID`                                | Identity for `ad/create`                      |
| `TIKTOK_LOCATION_UY_ID` or `TIKTOK_LOCATION_UY_IDS` | TikTok **location** IDs for Uruguay targeting |
| `TIKTOK_PIXEL_CODE`                                 | Optional on ad group                          |

### Optional: main app DB (event hints)

`MAIN_DATABASE_URL` — same Postgres as `apps/backend` — enables MCP `event_lookup` for audience keywords.

## Troubleshooting

- **Vite `~/` imports fail in dev UI** — Express mounts Vite with `configFile` pointing at `apps/marketing/vite.config.ts` (`src/web/server.ts`).
- **MP4 preview blank** — MinIO bucket **CORS** must allow GET from your UI origin (`http://127.0.0.1:4001`).
- **Render `done` but no preview URL** — worker must finish uploading; check `assetUrls.mp4Key`.
- **BullMQ stuck** — Redis host/port must match `MARKETING_REDIS_URL` and Docker.
- **TikTok location errors** — set `TIKTOK_LOCATION_UY_ID` to TikTok’s Uruguay location id(s) from Audience / targeting tools.

## Brand & agents

- Brand assets: [`brand/`](./brand/), [`src/brand/assets.ts`](./src/brand/assets.ts).
- Agent charter: [`AGENTS.md`](./AGENTS.md).
- MCP instructions: [`AGENT_PROMPT.md`](./AGENT_PROMPT.md).
