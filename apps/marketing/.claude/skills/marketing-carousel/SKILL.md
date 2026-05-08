---
name: marketing-carousel
description: Build Instagram/TikTok carousel slides with Satori + Sharp in @revendiste/marketing. Supports cover slides (with optional Higgsfield-generated artwork) and screenshot slides (Playwright captures of the live frontend).
---

# Marketing carousel (Satori)

## Slide model

`CarouselSlide` is a discriminated union (`src/carousels/types.ts`):

| `kind`         | Template                  | Use for                         |
| -------------- | ------------------------- | ------------------------------- |
| `cover`        | `CoverSlideTemplate`      | First slide. Big hook + cover image (or gradient fallback). |
| `content`      | `ContentSlideTemplate`    | Mid-deck explanation slides.    |
| `screenshot`   | `ScreenshotSlideTemplate` | Real UI inside a phone frame.   |

The renderer (`src/carousels/render.ts`) dispatches on `slide.kind`. Decks are JS arrays under `src/carousels/data/`.

## Pipeline

- Renderer: `src/carousels/render.ts` — `renderCarouselToPngs(kind, slides, outDir)`
- Templates: `src/carousels/templates/`
- Fonts: Poppins 700/800/900 from `@fontsource/poppins`
- CLI: `pnpm carousel` → `src/cli/generate-carousel.ts`

Satori rule: every multi-child `<div>` must use `display: 'flex'` (or `'none'`).

## Dimensions

- **1080×1350** — IG feed carousel.

## CLI

```bash
# Render with whatever assets exist (warns about missing covers/screenshots).
pnpm carousel -- --kind how-to-buy
pnpm carousel -- --kind how-to-sell

# Capture screenshots from the live frontend before rendering.
pnpm carousel -- --kind how-to-buy --capture
# (FRONTEND_URL defaults to https://127.0.0.1:3000 — frontend dev runs HTTPS_LOCAL=1)

# Generate a cover image via Higgsfield (gpt_image_2) before rendering.
pnpm carousel -- --kind how-to-buy --cover

# Do everything end-to-end.
pnpm carousel:full -- --kind how-to-buy
```

Output: `output/carousel-<kind>/01.png … NN.png`.

## Cover slides

A `cover` slide loads `brand/covers/<kind>.png` if present, otherwise falls back to the brand pink → orange gradient. The renderer never blocks on a missing cover. To produce one:

```bash
pnpm carousel -- --kind how-to-buy --cover
```

This calls the `higgsfield` CLI (`gpt_image_2`, 4:5, 2k) and writes the result to `brand/covers/<kind>.png`. Requires `higgsfield` on `$PATH` and an active session (`higgsfield account status`). The folder is git-ignored — covers are artifacts.

You can also drop a hand-made PNG at `brand/covers/<kind>.png` and the renderer will pick it up.

## Screenshot slides

Screenshot slides reference a captured PNG by `screenshotKey`. Targets are defined in `src/screenshots/targets.ts` (`SCREENSHOT_TARGETS`) — each entry is a route on `apps/frontend` plus a viewport and optional `waitForSelector`.

```bash
# Capture all targets
pnpm capture

# Capture a subset (comma-separated, supports prefix-* glob)
pnpm capture -- --only home,faq-*
```

**Requirements:**

- `apps/frontend` must be running locally (`pnpm dev` from repo root) at `https://127.0.0.1:3000`, or set `FRONTEND_URL` for staging/prod.
- The capture script auto-tolerates mkcert self-signed HTTPS (`ignoreHTTPSErrors: true`).
- It also detects when the Remotion bundler (also port 3000) is answering instead of the frontend, and refuses to proceed with a clear error.

PNGs land in `output/screenshots/<key>.png` and are loaded by the slide template via base64 data URL (no async fetch at render time).

## Adding a new screenshot target

1. Add a `ScreenshotTarget` to `SCREENSHOT_TARGETS` in `src/screenshots/targets.ts` (give it a stable `key`).
2. Reference it from a deck data file:

   ```ts
   {
     kind: 'screenshot',
     badge: 'Vista real',
     title: '...',
     body: '...',
     screenshotKey: 'your-new-key',
   }
   ```

3. Run `pnpm capture -- --only your-new-key` once to validate selectors, then `pnpm carousel -- --kind <deck>` to render.

## Data sources for copy

Both `how-to-buy.ts` and `how-to-sell.ts` distill the public FAQ at `apps/frontend/src/routes/preguntas-frecuentes.tsx`. Keep slide bodies aligned with the canonical FAQ wording (Spanish UY voseo) so a screenshot slide and the corresponding content slide match what a user actually reads on the site.
