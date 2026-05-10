import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

export const SCREENSHOTS_DIR = join(marketingRoot, 'output', 'screenshots');

export type ViewportPreset = 'mobile' | 'tablet' | 'desktop';

/** Post-navigation actions (see `capture.ts`). */
export type ScreenshotPrepare = 'home-search-modal-open';

export type ScreenshotTarget = {
  /** Stable id used by carousel decks to reference this capture. */
  key: string;
  /** Relative path on the frontend, e.g. "/preguntas-frecuentes". */
  path: string;
  /** Run after `goto` (e.g. open navbar search modal on mobile). */
  prepare?: ScreenshotPrepare;
  /** Optional CSS selector to wait for + crop to (when omitted, we shoot the full viewport). */
  waitForSelector?: string;
  /** Optional CSS selector to crop to via element.screenshot(). */
  cropSelector?: string;
  /** Viewport. Most carousel slides want mobile. */
  viewport?: ViewportPreset;
  /** Extra ms to wait after networkidle, for fonts/animations to settle. */
  settleMs?: number;
  /** Passed to Playwright `colorScheme` (carousel shots default to dark). */
  colorScheme?: 'light' | 'dark';
  /**
   * If true, this capture needs a logged-in user (e.g. `/entradas/publicar`).
   * Provide a Playwright storage state JSON via `STORAGE_STATE_PATH` env var
   * (or the default `apps/marketing/.auth/state.json`) — see
   * `pnpm capture:auth` to record one with Clerk credentials.
   */
  requiresAuth?: boolean;
};

/**
 * Routes worth capturing for marketing. Each must work without auth on the
 * deployed/dev site (so do not list `/cuenta/...`). For auth-only flows,
 * extend `capture.ts` with a storage state.
 *
 * Add new entries here, then reference by `key` from a `ScreenshotSlide`.
 */
export const SCREENSHOT_TARGETS: ScreenshotTarget[] = [
  {
    key: 'home',
    path: '/',
    viewport: 'mobile',
    settleMs: 800,
    colorScheme: 'dark',
  },
  {
    key: 'home-search-open',
    path: '/',
    viewport: 'mobile',
    prepare: 'home-search-modal-open',
    waitForSelector: '#event-search-modal',
    settleMs: 800,
    colorScheme: 'dark',
  },
  {
    key: 'faq-general',
    path: '/preguntas-frecuentes?seccion=general',
    viewport: 'mobile',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'faq-general-desktop',
    path: '/preguntas-frecuentes?seccion=general',
    viewport: 'desktop',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'faq-compradores',
    path: '/preguntas-frecuentes?seccion=compradores',
    viewport: 'mobile',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'faq-compradores-desktop',
    path: '/preguntas-frecuentes?seccion=compradores',
    viewport: 'desktop',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'faq-publicadores',
    path: '/preguntas-frecuentes?seccion=publicadores',
    viewport: 'mobile',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'faq-publicadores-desktop',
    path: '/preguntas-frecuentes?seccion=publicadores',
    viewport: 'desktop',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'faq-pagos',
    path: '/preguntas-frecuentes?seccion=pagos',
    viewport: 'mobile',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'faq-pagos-desktop',
    path: '/preguntas-frecuentes?seccion=pagos',
    viewport: 'desktop',
    waitForSelector: 'main, [role="main"], [role="tablist"]',
    settleMs: 1200,
    colorScheme: 'dark',
  },
  {
    key: 'eventos-hoy',
    path: '/eventos/hoy',
    viewport: 'mobile',
    settleMs: 800,
    colorScheme: 'dark',
  },
  {
    key: 'eventos-hoy-desktop',
    path: '/eventos/hoy',
    viewport: 'desktop',
    settleMs: 800,
    colorScheme: 'dark',
  },
  {
    key: 'garantia',
    path: '/garantia',
    viewport: 'mobile',
    settleMs: 600,
    colorScheme: 'dark',
  },
  {
    key: 'entradas-publicar',
    path: '/entradas/publicar',
    viewport: 'mobile',
    settleMs: 1500,
    colorScheme: 'dark',
    requiresAuth: true,
    waitForSelector: 'main, [role="main"], form',
  },
  {
    key: 'entradas-publicar-desktop',
    path: '/entradas/publicar',
    viewport: 'desktop',
    settleMs: 1500,
    colorScheme: 'dark',
    requiresAuth: true,
    waitForSelector: 'main, [role="main"], form',
  },
];

export const VIEWPORTS: Record<ViewportPreset, {width: number; height: number}> = {
  mobile: {width: 390, height: 844},
  tablet: {width: 820, height: 1180},
  desktop: {width: 1440, height: 900},
};

export function screenshotPath(key: string): string {
  return join(SCREENSHOTS_DIR, `${key}.png`);
}
