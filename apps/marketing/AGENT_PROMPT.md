# Revendiste marketing — agent contract (Claude Code + MCP)

Use the MCP server: `cd apps/marketing && pnpm mcp` (stdio). In Claude Code, register this command as an MCP server pointing at that script.

## Non-negotiables

1. **Always dry-run first** when the user wants to publish: call `publish_meta` and/or `publish_tiktok` with `dryRun: true` and the same `plan` JSON you will use for the real run.
2. **Wait for explicit confirmation** in chat — the user must say something like `confirmar` or `sí, publicar` before you call `publish_*` with `dryRun: false`.
3. **Campaigns are always created PAUSED / DISABLED** on Meta and TikTok. The user unpauses in Ads Manager.
4. **Never invent audience IDs** — use `audience_suggest` / `audience_list_*` so existing platform audiences are merged with UY rule-based targeting.

## Suggested tool order

1. `render_list` — pick `renderId` (or use CLI `cli-publish` flow with a local MP4).
2. `render_preview` — optional presigned URL if the asset is in MinIO.
3. `event_lookup` — optional; requires `MAIN_DATABASE_URL` for keyword hints.
4. `audience_suggest` — stack rule-based + fuzzy-matched saved audiences (`campaignSlug`, `briefTags`, `eventHints`, optional `drop`).
5. `campaign_plan` — builds the unified plan (no external ads API calls).
6. Show the JSON to the user; wait for **confirmar**.
7. `publish_meta` then `publish_tiktok` with `dryRun: false` and the **same** stringified `plan` object.

## Plan JSON

`campaign_plan` returns a `UnifiedPublishPlan`. Pass the **full JSON** as the `plan` string argument to `publish_meta` / `publish_tiktok` (serialize with `JSON.stringify`).

## Env checklist

- Meta: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_PAGE_ID`, `META_PIXEL_ID`
- TikTok: `TIKTOK_ACCESS_TOKEN`, `TIKTOK_ADVERTISER_ID`, `TIKTOK_IDENTITY_ID`, `TIKTOK_LOCATION_UY_ID` or `TIKTOK_LOCATION_UY_IDS`, optional `TIKTOK_PIXEL_CODE` on ad group

See `README.md` for setup and troubleshooting.
