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

/** Carousel icons use lucide-react `__iconNode` geometry (stroke SVG in Satori). */
export type ContentSlideIconKey =
  | 'verify'
  | 'list'
  | 'mail'
  | 'wallet'
  | 'sparkles'
  | 'idCard'
  | 'scanFace'
  | 'fileText'
  | 'calendar'
  | 'ticket'
  | 'tag'
  | 'upload'
  | 'bell'
  | 'banknote'
  | 'handCoins'
  | 'clock'
  | 'circleCheck'
  /** Scroll / legal doc (e.g. TOS) */
  | 'scrollText'
  /** Bank / institution */
  | 'landmark';

/** Short runs rendered above `body` in one flex row (Satori-safe; keep few words per run). */
export type ContentSlideBodyLeadSpan = {
  text: string;
  emphasize?: boolean;
};

/** Ordered runs for the full body (flex-wrap). Include spaces at run boundaries in `text`. */
export type ContentSlideBodyRun = {
  text: string;
  emphasize?: boolean;
};

/** Middle-of-deck content slide (existing template). */
export type ContentSlide = {
  kind: 'content';
  badge: string;
  title: string;
  /**
   * Plain paragraph. Ignored when `bodyRuns` is set (use `body: ''` then).
   * When `bodyLeadSpans` is set, omit the lead clause (shown above).
   */
  body: string;
  /** Optional lead line before `body` (e.g. hook + pink phrase) without mixing long wrap + flex row. */
  bodyLeadSpans?: ReadonlyArray<ContentSlideBodyLeadSpan>;
  /**
   * Full body as runs (emphasis mid-paragraph). Overrides `body` / `bodyLeadSpans` when non-empty.
   * The template splits runs into word-sized flex items so line breaks match normal copy.
   */
  bodyRuns?: ReadonlyArray<ContentSlideBodyRun>;
  icon?: ContentSlideIconKey;
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
  /**
   * When set, a QR is rendered under the body (PNG data URL at build time).
   * Use a full https URL (e.g. FAQ deep link).
   */
  bodyQrUrl?: string;
  /** Stable key matching `SCREENSHOT_TARGETS[*].key` in capture.ts. */
  screenshotKey: string;
  icon?: ContentSlideIconKey;
  /** Phone frame by default; desktop places a wide browser-like screenshot below the text. */
  presentation?: 'phone' | 'desktop';
};

/** Card grid for explaining principles without long paragraphs. */
export type CardsSlide = {
  kind: 'cards';
  badge: string;
  title: string;
  intro?: string;
  cards: ReadonlyArray<{
    title: string;
    body: string;
    icon: ContentSlideIconKey;
  }>;
};

/**
 * Vertical numbered stepper — describes a flow as a list of small steps with a
 * one-line label and an icon. Used for "how to verify", "how to publish", etc.
 */
export type StepperSlide = {
  kind: 'stepper';
  badge: string;
  title: string;
  /** Optional one-line lead-in shown above the stepper. */
  intro?: string;
  steps: ReadonlyArray<{
    label: string;
    icon: ContentSlideIconKey;
    /** Optional helper line under the step label. */
    detail?: string;
  }>;
};

/** Shared follow-us CTA; copy lives in `ClosingSlideTemplate`. */
export type ClosingSlide = {
  kind: 'closing';
};

export type CarouselSlide =
  | CoverSlide
  | ContentSlide
  | CardsSlide
  | ScreenshotSlide
  | StepperSlide
  | ClosingSlide;
