---
name: marketing-carousel-pipeline
description: End-to-end workflow for Instagram/TikTok carousel PNGs in @revendiste/marketing — deck data, Playwright captures, optional Higgsfield GPT Image 2 covers, Satori render, outputs, and troubleshooting.
---

# Marketing carousel pipeline

Use this skill when the user (or you) wants to **build, refresh, or ship** carousel decks from `@revendiste/marketing`: one place for commands, file layout, and how the pieces connect.

## Mental model

```
Deck TS (slides) → optional Higgsfield cover PNG → optional Playwright screenshots → Satori → output/carousel-<kind>/*.png
```

- **Slides** are arrays in `src/carousels/data/*.ts` (`cover` | `content` | `screenshot` | `stepper`).
- **Cover** (slide 1): text/scrim in Satori; optional **AI** image from `brand/covers/<kind>.png` (gitignored) via `gpt_image_2` + prompts in `src/ai/cover-image.ts` (brand tokens).
- **Inner slides**: top **step bar** (`CarouselStepProgress`) + body; screenshot slides need PNGs under `output/screenshots/<key>.png`.

## Fast path (human or agent)

From `apps/marketing`:

```bash
# Default: --capture + --cover + render (needs frontend + optional Higgsfield)
pnpm carousel:pipeline -- --kind how-to-sell

# Same defaults, positional kind
pnpm carousel:pipeline -- how-to-buy

# Satori only (no Playwright, no Higgsfield)
pnpm carousel:pipeline -- --kind what-is-revendiste --render-only

# Screenshots but no AI cover
pnpm carousel:pipeline -- --kind how-to-buy --no-cover
```

## Iterate copy/layout **without** a new Higgsfield image

If `brand/covers/<kind>.png` already exists, **do not** pass `--cover` (or use `--no-cover` on the pipeline). The same PNG is reused until you delete it or regenerate.

```bash
# Re-render only (uses existing cover + existing screenshots)
pnpm carousel:pipeline -- --kind how-to-sell --render-only

# Refresh screenshots, keep existing AI cover
pnpm carousel:pipeline -- --kind how-to-sell --no-cover

# Lower level (same idea)
pnpm carousel -- --kind how-to-sell
pnpm carousel -- --kind how-to-sell --capture
```

Equivalent lower-level commands are in `marketing-carousel` skill (`pnpm carousel`, `carousel:capture`, `carousel:full`).

## Deck kinds (`--kind`)

| Kind | Data file |
|------|-------------|
| `how-to-sell` | `src/carousels/data/how-to-sell.ts` |
| `how-to-buy` | `src/carousels/data/how-to-buy.ts` |
| `what-is-revendiste` | `src/carousels/data/what-is-revendiste.ts` |

Retiros para vendedores viven en **`how-to-sell`** (slide stepper «Cobrar»), no hay deck aparte.

Adding a deck: new data file → register in `src/cli/generate-carousel.ts`, `src/cli/debug-carousel-slide.ts`, `src/carousels/render.ts` (`CarouselKind`), `src/ai/cover-image.ts` (`CoverDeck` + prompt).

## Prerequisites

| Need | When |
|------|------|
| `pnpm carousel:pipeline` / `generate-carousel` | Always from `apps/marketing`. |
| Frontend at `FRONTEND_URL` (default `https://127.0.0.1:3000`) | `--capture` (mkcert HTTPS ok). |
| `higgsfield` on PATH or `HIGGSFIELD_CLI` | `--cover` only. |
| Screenshot targets | `src/screenshots/targets.ts` — keys referenced by `screenshotKey` in deck data. |

## Key paths

| Path | Role |
|------|------|
| `output/carousel-<kind>/NN.png` | Final slides |
| `output/screenshots/<key>.png` | Playwright captures |
| `brand/covers/<kind>.png` | AI cover (optional) |
| `brand/backgrounds/` | Static brand plates (Remotion `staticFile`; manifest in `brand/manifest.json`) |

## Copy & brand

- On-slide copy: **Spanish (Uruguay, voseo)** — see repo `.claude/skills/revendiste-ux-writing` and FAQ source `apps/frontend/src/routes/preguntas-frecuentes.tsx` where relevant.
- **GPT Image 2** cover prompts: English in `cover-image.ts`; palette from `src/brand/tokens.ts`.

## Debugging one slide

```bash
pnpm carousel:debug-slide -- --kind how-to-buy --index 0
pnpm carousel:debug-slide -- --kind how-to-buy --screenshot
```

## Related skills

- **marketing-carousel** — Satori slide model, `--capture` / `--cover` flags, Lucide vs filled icons.
- **marketing-higgsfield** — CLI auth and Revendiste conventions.
- **revendiste-ux-writing** — user-facing strings.
