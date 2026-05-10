---
name: marketing-remotion
description: Author and render Remotion compositions for @revendiste/marketing (9x16 ads, Spritz typography).
---

# Marketing Remotion

## Entry & config

- Entry (calls `registerRoot`): [`src/remotion/index.ts`](../../../src/remotion/index.ts)
- Compositions: [`src/remotion/Root.tsx`](../../../src/remotion/Root.tsx)
- Public assets: [`brand/`](../../../brand/) via [`remotion.config.ts`](../../../remotion.config.ts) `Config.setPublicDir('brand')` → `staticFile('logos/...')`.

## Reference composition

- **Spritz kinetic**: [`src/remotion/compositions/SpritzHookAd.tsx`](../../../src/remotion/compositions/SpritzHookAd.tsx) + [`SpritzWord.tsx`](../../../src/remotion/components/SpritzWord.tsx)
- Duration helper: [`src/remotion/computeSpritzDuration.ts`](../../../src/remotion/computeSpritzDuration.ts)

## Commands

```bash
cd apps/marketing
pnpm remotion:studio
pnpm exec remotion render src/remotion/index.ts SpritzHookAd output/preview.mp4
```

## Brand

Use `staticFile()` for logos under `brand/logos/`. Colors should align with [`brand/palettes/colors.json`](../../../brand/palettes/colors.json) (do not invent new primaries without updating the palette).
