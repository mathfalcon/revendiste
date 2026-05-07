---
name: marketing-publish
description: Publish marketing creatives to Meta and TikTok from @revendiste/marketing (draft-first).
---

# Marketing publish

## Code

- Shared types: [`src/publishers/common.ts`](../../../src/publishers/common.ts)
- Meta: [`src/publishers/meta.ts`](../../../src/publishers/meta.ts) — video upload + ad creative (draft); full campaign **not** implemented in v1.
- TikTok: [`src/publishers/tiktok.ts`](../../../src/publishers/tiktok.ts) — stub / partial upload; extend for production.
- Audit log: [`src/publishers/publish-log.ts`](../../../src/publishers/publish-log.ts) → `publish_logs` table.

## CLI

[`src/cli/publish.ts`](../../../src/cli/publish.ts):

```bash
pnpm publish -- --platform meta --file ./output/foo.mp4 --mode draft
pnpm publish -- --platform tiktok --file ./output/foo.mp4 --mode launch --confirm
```

## Env

See [`README.md`](../../../README.md) and [`.env.example`](../../../.env.example): `META_*`, `TIKTOK_*`.

## Safety

Never automate **launch** without explicit `--confirm` and verified budgets/targeting.
