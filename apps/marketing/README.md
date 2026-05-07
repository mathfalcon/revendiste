# @revendiste/marketing

Local-only marketing pipeline: briefs → renders (Remotion / Satori / Higgsfield) → optional Meta & TikTok publishers. **Not deployed** — runs on your machine with Docker.

## Prerequisites

- Docker
- Node 20+ and pnpm (repo root)
- Optional: `higgsfield` CLI for AI generation ([Higgsfield install](https://github.com/higgsfield-ai/cli))
- Optional: `pg_dump` / `pg_restore` for `pnpm db:snapshot`

## Quick start

```bash
cd apps/marketing
cp .env.example .env
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Open **http://127.0.0.1:4001** — Ideas board, enqueue Remotion renders (requires Redis + MinIO + Postgres up).

### Playwright screenshots

```bash
cd apps/marketing
pnpm exec playwright install chromium
pnpm capture
```

Set `FRONTEND_URL` if the app is not on `http://127.0.0.1:3000`.

## Useful commands

| Command                                                                | Description                                                        |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `pnpm dev`                                                             | Express + Vite UI on `:4001`                                       |
| `pnpm remotion:studio`                                                 | Remotion Studio for compositions                                   |
| `pnpm render:spritz`                                                   | Render `SpritzHookAd` to `output/spritz-preview.mp4`               |
| `pnpm carousel`                                                        | Satori carousel PNGs → `output/carousel-how-to-sell/`              |
| `pnpm generate-ad`                                                     | Render Spritz; with `--brief-slug X` also writes `renders` + MinIO |
| `pnpm publish -- --platform meta --file ./output/foo.mp4 --mode draft` | Meta draft upload (needs tokens)                                   |
| `pnpm db:reset`                                                        | `TRUNCATE` data tables + `pnpm db:seed`                            |
| `pnpm db:export`                                                       | Export `briefs` rows → `seeds/briefs/*.json`                       |
| `pnpm db:snapshot`                                                     | `pg_dump` custom format → `seeds/_snapshot.dump`                   |

## Environment

See [.env.example](./.env.example). Marketing uses **separate** Postgres (`:5544`), Redis (`:6479`), and MinIO (`:9000`).

## Meta / TikTok

- **Meta**: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID` (`act_…`), and `META_PAGE_ID` for video creatives.
- **TikTok**: `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID`. Upload path is partially stubbed — extend `src/publishers/tiktok.ts` for production multipart upload.

Full spend (`--mode launch`) requires `--confirm` on `pnpm publish`.

## Brand assets

Drop files under [`brand/`](./brand/) and update [`brand/manifest.json`](./brand/manifest.json). Code loads paths via `src/brand/assets.ts` and colors via `src/brand/tokens.ts`.

## Agent context

See [AGENTS.md](./AGENTS.md) and `docs/ENGRAM-SEED.md` for AI assistants.
