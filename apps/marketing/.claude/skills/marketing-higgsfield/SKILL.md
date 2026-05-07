---
name: marketing-higgsfield
description: Revendiste-specific Higgsfield CLI usage for @revendiste/marketing (wraps global higgsfield-generate patterns).
---

# Marketing + Higgsfield

## Wrapper

- Code: [`src/ai/higgsfield.ts`](../../../src/ai/higgsfield.ts) — `runHiggsfield`, `higgsfieldGenerateCreate`.
- Prompt fragments: [`src/ai/prompts/`](../../../src/ai/prompts/)

## Project conventions

- **Aspect**: short-form ads → **9:16** (`--aspect_ratio 9:16` when the model supports it).
- **Language**: prompts and on-screen copy → **Spanish (Uruguay)**.
- **References**: pass mood / style refs from [`brand/references/`](../../../brand/references/) with `--image` when steering look (see global `higgsfield-generate` skill for CLI details).
- **Product / UI**: use [`brand/products/`](../../../brand/products/) for Marketing Studio-style product context.

## Auth

Requires `higgsfield` on PATH and a valid session (`higgsfield account status`). Interactive login: `higgsfield auth login`.

## Global skill

CLI mechanics, model catalog, and Marketing Studio flows: use repo/global skill **higgsfield-generate** — this skill only adds **Revendiste marketing** defaults on top.
