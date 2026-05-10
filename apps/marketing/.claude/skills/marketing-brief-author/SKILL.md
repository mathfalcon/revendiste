---
name: marketing-brief-author
description: Draft and seed marketing briefs (ideas) for the Revendiste @revendiste/marketing local pipeline.
---

# Marketing brief author

Use when creating or editing **briefs** (ad ideas) for `apps/marketing`.

## Files

- Seed JSON: [`seeds/briefs/*.json`](../../../seeds/briefs/) — one file per idea, committed to git.
- Loader: [`src/db/seed.ts`](../../../src/db/seed.ts) — upserts by **`slug`** (unique).
- DB table: `briefs` — see [`src/db/migrations/1770000000001_create_briefs.ts`](../../../src/db/migrations/1770000000001_create_briefs.ts).

## JSON shape

```json
{
  "slug": "kebab-case-unique",
  "title": "Short title",
  "kind": "video_kinetic | video_ai | video_ugc | carousel_howto",
  "status": "draft | ready | archived",
  "prompt": "Full creative brief (markdown ok)",
  "props": {},
  "tags": ["optional"],
  "targetPlatforms": ["tiktok", "instagram", "meta"]
}
```

For **Spritz-style kinetic video**, mirror [`seeds/briefs/spritz-hook-10s.json`](../../../seeds/briefs/spritz-hook-10s.json): `props.hook` (word-by-word; `__blank__`, `__logo__`), `problem` / `solution` / `pitch` / `cta`, optional `wordsPerSecond` (WPM÷60), `wordsPerSecondAfterBlank`, `slowWpmAfterBlankCount` (default 1), `pauseAfterProblemSec`, `outroSec`.

## Workflow

1. Add `seeds/briefs/<slug>.json`.
2. Run `pnpm db:seed` from `apps/marketing` (or `pnpm db:reset` to truncate + seed).
3. Optional: `pnpm db:export` to write DB rows back to JSON after UI edits.

## Copy

All user-facing strings: **Spanish (Uruguay)**. Use repo skill `revendiste-ux-writing` for tone.
