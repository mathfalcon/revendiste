/**
 * Slide model for IG/TikTok carousel decks (1080x1350).
 *
 * Each slide is a discriminated union by `kind`. The renderer in
 * `render.ts` picks the matching template at slide level (so a deck can
 * mix a cover, several content slides, screenshot slides, and a CTA).
 */

/** Top-of-deck "scroll-stopper". Big hook, gradient, optional cover image. */
export type CoverSlide = {
  kind: 'cover';
  /** Short eyebrow over the title — e.g. "Vender en Revendiste". */
  eyebrow: string;
  /** Big hook (8–12 words). Avoid more than two lines on 1080x1350. */
  title: string;
  /** Optional sub-hook (one short line). */
  subtitle?: string;
  /**
   * Optional absolute path to a background cover image (e.g. higgsfield).
   * If missing or unreadable, the template falls back to a brand gradient.
   */
  backgroundImagePath?: string;
};

/** Middle-of-deck content slide (existing template). */
export type ContentSlide = {
  kind: 'content';
  badge: string;
  title: string;
  body: string;
};

/**
 * Screenshot-of-the-app slide. Renders a phone frame around the captured
 * PNG with a caption underneath. The capture path is produced by
 * `src/screenshots/capture.ts` and is keyed by `screenshotKey`.
 */
export type ScreenshotSlide = {
  kind: 'screenshot';
  badge: string;
  title: string;
  body: string;
  /** Stable key matching `SCREENSHOT_TARGETS[*].key` in capture.ts. */
  screenshotKey: string;
};

export type CarouselSlide = CoverSlide | ContentSlide | ScreenshotSlide;
