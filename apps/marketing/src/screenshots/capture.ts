/**
 * Playwright capture for carousel screenshots.
 *
 * Requires the Revendiste **frontend** (apps/frontend) at FRONTEND_URL
 * (default https://127.0.0.1:3000 with mkcert). Run `pnpm dev` from repo root.
 *
 * Browser `colorScheme` defaults to **dark** so screenshots match the app in
 * dark mode (`targets.ts` per-target `colorScheme` overrides). This does not
 * affect the marketing local dashboard UI.
 *
 * Usage:
 *   pnpm capture                        # captures all targets
 *   pnpm capture -- --only home,faq-*   # captures matching keys (glob-like)
 */
import 'dotenv/config';
import {existsSync, mkdirSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium, type Browser, type Page} from 'playwright';
import {
  SCREENSHOTS_DIR,
  SCREENSHOT_TARGETS,
  VIEWPORTS,
  screenshotPath,
  type ScreenshotPrepare,
  type ScreenshotTarget,
} from './targets';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');

/**
 * Default Playwright storage-state location. Override with `STORAGE_STATE_PATH`.
 * Folder is gitignored — never commit Clerk session cookies.
 */
export const DEFAULT_STORAGE_STATE_PATH = join(
  marketingRoot,
  '.auth',
  'state.json',
);

function resolveStorageStatePath(): string {
  return process.env.STORAGE_STATE_PATH ?? DEFAULT_STORAGE_STATE_PATH;
}

function hasUsableStorageState(): boolean {
  return existsSync(resolveStorageStatePath());
}

type CaptureOptions = {
  baseUrl: string;
  only?: string[];
};

function parseOnly(argv: string[]): string[] | undefined {
  const idx = argv.indexOf('--only');
  if (idx < 0) {
    return undefined;
  }
  const raw = argv[idx + 1];
  if (!raw) {
    return undefined;
  }
  return raw.split(',').map(s => s.trim()).filter(Boolean);
}

function matches(key: string, patterns: string[]): boolean {
  return patterns.some(p => {
    if (p.endsWith('*')) {
      return key.startsWith(p.slice(0, -1));
    }
    return key === p;
  });
}

async function checkReachable(baseUrl: string): Promise<void> {
  // Lightweight GET so we fail loud instead of timing out in Chromium.
  // For HTTPS localhost (mkcert), temporarily disable cert validation in
  // this process so the probe doesn't reject the self-signed cert.
  const isLocalHttps =
    baseUrl.startsWith('https://') &&
    /:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)/.test(baseUrl);
  const previousEnv = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  if (isLocalHttps) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  }
  try {
    const url = new URL('/preguntas-frecuentes', baseUrl).toString();
    const res = await fetch(url, {method: 'GET'});
    const body = await res.text();
    // Detect the Remotion webpack bundler accidentally answering on the
    // same port (it serves a JSON 404 with this marker).
    if (body.includes('remotion-webpack-bundle')) {
      throw new Error(
        `El servicio en ${baseUrl} es el bundler de Remotion, no el frontend.\n` +
          'Cerrá Remotion (o cambiale de puerto) y levantá apps/frontend con `pnpm dev`.',
      );
    }
    if (!res.ok && res.status >= 500) {
      throw new Error(`status ${res.status}`);
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith('El servicio en')) {
      throw e;
    }
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(
      `No se pudo alcanzar el frontend en ${baseUrl}: ${msg}.\n` +
        '¿Levantaste apps/frontend? Probá `pnpm dev` desde la raíz del repo, ' +
        'o exportá FRONTEND_URL=https://revendiste.com para usar producción.',
    );
  } finally {
    if (isLocalHttps) {
      if (previousEnv === undefined) {
        delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
      } else {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = previousEnv;
      }
    }
  }
}

async function runPrepare(page: Page, prepare: ScreenshotPrepare): Promise<void> {
  switch (prepare) {
    case 'home-search-modal-open': {
      const mobile = await page
        .getByTestId('navbar-open-event-search')
        .count()
        .then(c => c > 0);
      if (mobile) {
        await page.getByTestId('navbar-open-event-search').click();
      } else {
        await page.getByTestId('navbar-open-event-search-desktop').click();
      }
      await page.locator('#event-search-modal').waitFor({
        state: 'visible',
        timeout: 20_000,
      });
      // Empty-query fetch shows a spinner then either "Próximos eventos" + list or an empty list.
      const modal = page.locator('#event-search-modal').locator('xpath=ancestor::*[contains(@class,"fixed")][1]');
      await modal
        .locator('.animate-spin')
        .first()
        .waitFor({state: 'hidden', timeout: 30_000})
        .catch(() => undefined);
      await page
        .getByText('Próximos eventos')
        .first()
        .waitFor({state: 'visible', timeout: 5000})
        .catch(() => undefined);
      await page.waitForTimeout(600);
      return;
    }
    default:
      return;
  }
}

async function captureOne(
  browser: Browser,
  baseUrl: string,
  target: ScreenshotTarget,
): Promise<string> {
  const viewport = VIEWPORTS[target.viewport ?? 'mobile'];
  const storageStatePath = resolveStorageStatePath();
  const useAuth = target.requiresAuth === true && existsSync(storageStatePath);

  if (target.requiresAuth && !useAuth) {
    throw new Error(
      `Target "${target.key}" requires a logged-in session but no storage state was found at ${storageStatePath}.\n` +
        '  Run `pnpm capture:auth` once to record one (Chromium will open so you can log in with Clerk).',
    );
  }

  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: 2,
    locale: 'es-UY',
    colorScheme: target.colorScheme ?? 'dark',
    ignoreHTTPSErrors: true,
    ...(useAuth ? {storageState: storageStatePath} : {}),
  });

  const page: Page = await ctx.newPage();
  const url = baseUrl.replace(/\/$/, '') + target.path;

  await page.goto(url, {waitUntil: 'networkidle', timeout: 60_000});
  if (target.prepare) {
    await runPrepare(page, target.prepare);
  }
  if (target.waitForSelector) {
    await page.waitForSelector(target.waitForSelector, {timeout: 20_000});
  }
  if (target.settleMs) {
    await page.waitForTimeout(target.settleMs);
  }

  const out = screenshotPath(target.key);
  if (target.cropSelector) {
    const el = await page.$(target.cropSelector);
    if (el) {
      await el.screenshot({path: out});
    } else {
      await page.screenshot({path: out, fullPage: false});
    }
  } else {
    await page.screenshot({path: out, fullPage: false});
  }

  await ctx.close();
  return out;
}

export async function capture(options: CaptureOptions): Promise<string[]> {
  await checkReachable(options.baseUrl);
  mkdirSync(SCREENSHOTS_DIR, {recursive: true});

  const targets = options.only
    ? SCREENSHOT_TARGETS.filter(t => matches(t.key, options.only!))
    : SCREENSHOT_TARGETS;

  if (targets.length === 0) {
    console.warn('No screenshot targets matched the --only filter.');
    return [];
  }

  const needsAuth = targets.some(t => t.requiresAuth);
  if (needsAuth && !hasUsableStorageState()) {
    console.warn(
      `! Some targets need auth but no storage state at ${resolveStorageStatePath()}.\n  Run \`pnpm capture:auth\` once to record one.`,
    );
  }

  const browser = await chromium.launch();
  const results: string[] = [];
  try {
    for (const target of targets) {
      try {
        const out = await captureOne(browser, options.baseUrl, target);
        console.info(`✓ ${target.key.padEnd(24)} → ${out}`);
        results.push(out);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.warn(`✗ ${target.key.padEnd(24)} (${msg})`);
      }
    }
  } finally {
    await browser.close();
  }
  return results;
}

async function main() {
  // The frontend dev server defaults to HTTPS (HTTPS_LOCAL=1) on port 3000.
  // Override with FRONTEND_URL=http://localhost:3000 if you run it plain.
  const baseUrl = process.env.FRONTEND_URL ?? 'https://127.0.0.1:3000';
  const only = parseOnly(process.argv.slice(2));
  const out = await capture({baseUrl, only});
  console.info(`\nDone. ${out.length} screenshots in ${SCREENSHOTS_DIR}`);
}

const isMain = (() => {
  try {
    return import.meta.url === `file://${process.argv[1]}`;
  } catch {
    return false;
  }
})();

if (isMain) {
  main().catch(e => {
    console.error(e);
    process.exit(1);
  });
}
