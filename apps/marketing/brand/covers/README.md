# Carousel covers

Generated cover images for IG/TikTok carousel decks (1080×1350, vertical 4:5).

These are produced by `pnpm carousel -- --kind <deck> --cover`, which calls
the Higgsfield CLI (`gpt_image_2`) and writes the result here as
`<deck>.png` (e.g. `how-to-buy.png`, `how-to-sell.png`).

You can also drop a hand-made PNG with the same filename — `CoverSlide.tsx`
will use whatever exists. If no file is present, the cover slide falls back
to the brand pink → orange gradient.

This folder is git-ignored (artifacts), except this README.
