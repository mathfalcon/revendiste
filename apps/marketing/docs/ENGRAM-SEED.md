# Engram seed suggestions (`mem_save`)

When Engram MCP is available, save short facts so future sessions recall this workspace without re-reading the repo. (If `mem_save` is not configured in your Cursor MCP, copy the bullets below into Engram manually.)

Suggested entries (paraphrase in your own words):

1. **Revendiste marketing stack**: `apps/marketing` is local-only; Docker provides Postgres **5544**, Redis **6479**, MinIO **9000/9001**; web UI default **4001**.
2. **Brief identity**: marketing briefs are keyed by **`slug`** (kebab-case); JSON seeds live in `apps/marketing/seeds/briefs/` and `pnpm db:seed` upserts.
3. **Persistence**: Docker volumes are **not** committed; reproducibility = migrations + JSON seeds + `pnpm db:reset` (truncate + seed).
4. **Renders**: BullMQ queue `marketing-renders`; worker runs `executeSpritzRender`; finished MP4 keys under MinIO `renders/<id>.mp4`.
5. **Publish safety**: `pnpm publish` requires `--confirm` for `--mode launch`; Meta needs `META_PAGE_ID` for video creatives; TikTok upload is stubbed.

Run `mem_save` once per bullet or combine into one structured note.
