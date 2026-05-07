# Marketing workspace — agent charter

## What this is

`@revendiste/marketing` is a **local-only** tool (never deployed). It orchestrates:

1. **Briefs** (`briefs` table + `seeds/briefs/*.json`) — creative ideas / copy decks.
2. **Renders** (`renders` table + MinIO objects) — outputs from Remotion, Satori, or Higgsfield.
3. **Campaigns** (`campaigns` + `publish_logs`) — Meta / TikTok API attempts (draft-first).

Infra: `docker compose` → Postgres `:5544`, Redis `:6479`, MinIO `:9000`.

## Mental model

```
brief (slug, prompt, props) → render (engine, status, assetUrls) → campaign (platform, mode)
```

- **Slug** is the stable id for seeds (`kebab-case`, unique).
- **Outputs** live in MinIO (keys under `renders/…`), not in git. Re-render to regenerate.
- **Redis** is ephemeral queue storage (BullMQ); do not rely on it for persistence.

## Hard rules

1. **User-facing copy** (briefs, carousels, ads): **Spanish (Uruguay, voseo)**. Follow repo UX skill `.claude/skills/revendiste-ux-writing` when editing copy.
2. **Brand colors**: from [`brand/palettes/colors.json`](./brand/palettes/colors.json) via [`src/brand/tokens.ts`](./src/brand/tokens.ts) — do not hardcode hex in multiple places.
3. **Brand files**: resolve via [`src/brand/assets.ts`](./src/brand/assets.ts) / `manifest.json` — no raw `../../brand/...` string paths scattered in code.
4. **DB access**: Kysely + `CamelCasePlugin`; tables are snake_case in SQL, **camelCase in TypeScript** (`targetPlatforms`, `briefId`, …). Migrations live in [`src/db/migrations/`](./src/db/migrations/).
5. **IDs**: use `gen_random_uuid()` in migrations; app generates UUIDs for renders when needed.
6. **Spend safety**: never pass `--mode launch` / auto-launch without explicit human `--confirm` semantics (see `src/cli/publish.ts`).
7. **Git**: do not commit `output/`, `.env`, or `brand/originals/**` (except `brand/originals/README.md`).

## Commands (cheat sheet)

```bash
docker compose up -d
pnpm db:migrate && pnpm db:seed
pnpm dev                              # UI :4001
pnpm remotion:studio                  # Visual iteration
pnpm carousel                         # Satori PNGs
pnpm generate-ad -- --brief-slug spritz-hook-10s
pnpm db:export                        # briefs → seeds/briefs/
```

## Specialized skills (this package)

Under [`.claude/skills/`](./.claude/skills/) (this package) — load the relevant skill when:

- Authoring brief JSON → `marketing-brief-author`
- Remotion compositions → `marketing-remotion`
- Satori carousels → `marketing-carousel`
- Higgsfield CLI (project deltas) → `marketing-higgsfield`
- Meta/TikTok publish → `marketing-publish`

## Persistence across machines

- Commit **migrations** + **`seeds/briefs/*.json`**, not Docker volumes.
- `pnpm db:reset` truncates data tables and re-seeds.
