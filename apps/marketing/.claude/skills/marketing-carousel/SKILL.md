---
name: marketing-carousel
description: Build Instagram/TikTok carousel slides with Satori + Sharp in @revendiste/marketing.
---

# Marketing carousel (Satori)

## Pipeline

- Renderer: [`src/carousels/render.ts`](../../../src/carousels/render.ts) — `renderCarouselToPngs(kind, slides, outDir)`
- Templates: [`src/carousels/templates/`](../../../src/carousels/templates/) — JSX for Satori (**each** `div` with multiple layout children needs `display: 'flex'` or `'none'` per Satori rules).
- Fonts: Poppins 700 loaded from `@fontsource/poppins` in `render.ts`.
- CLI: `pnpm carousel` → [`src/cli/generate-carousel.ts`](../../../src/cli/generate-carousel.ts)

## Dimensions

- **1080×1350** — IG feed carousel slides (see `HowToSellSlide`).

## Data

Example slides: [`src/carousels/data/how-to-sell.ts`](../../../src/carousels/data/how-to-sell.ts).

## Screenshots

Optional live UI captures: [`src/screenshots/capture.ts`](../../../src/screenshots/capture.ts) + flows under `src/screenshots/flows/`.
