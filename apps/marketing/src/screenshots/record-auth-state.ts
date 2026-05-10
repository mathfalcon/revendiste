/**
 * One-time helper to record a Playwright `storageState` file with a logged-in
 * Clerk session. Use it for screenshot targets that have `requiresAuth: true`
 * (e.g. `/entradas/publicar`, anything under `/cuenta`).
 *
 * Usage:
 *   pnpm capture:auth                          # opens https://127.0.0.1:3000
 *   FRONTEND_URL=https://staging.revendiste.com pnpm capture:auth
 *
 * A Chromium window opens. Log in with a real (test) account, complete document
 * verification if needed, then come back to the terminal and press ENTER. We
 * persist the cookies + localStorage to STORAGE_STATE_PATH (default
 * `apps/marketing/.auth/state.json`). That folder is gitignored — these are
 * session secrets, do not commit them.
 */
import 'dotenv/config';
import {mkdirSync} from 'node:fs';
import {dirname} from 'node:path';
import readline from 'node:readline';
import {chromium} from 'playwright';
import {DEFAULT_STORAGE_STATE_PATH} from './capture';

function waitForEnter(promptText: string): Promise<void> {
  const rl = readline.createInterface({input: process.stdin, output: process.stdout});
  return new Promise(resolve => {
    rl.question(promptText, () => {
      rl.close();
      resolve();
    });
  });
}

async function main() {
  const baseUrl = process.env.FRONTEND_URL ?? 'https://127.0.0.1:3000';
  const storageStatePath = process.env.STORAGE_STATE_PATH ?? DEFAULT_STORAGE_STATE_PATH;
  mkdirSync(dirname(storageStatePath), {recursive: true});

  const browser = await chromium.launch({headless: false});
  const ctx = await browser.newContext({
    viewport: {width: 390, height: 844},
    deviceScaleFactor: 2,
    locale: 'es-UY',
    ignoreHTTPSErrors: true,
  });
  const page = await ctx.newPage();

  console.info(`\n→ Abriendo ${baseUrl}. Iniciá sesión con Clerk en la ventana.`);
  await page.goto(baseUrl, {waitUntil: 'domcontentloaded'}).catch(() => undefined);

  await waitForEnter(
    '\nCuando estés logueado (y verificado, si vas a capturar /entradas/publicar), volvé acá y apretá ENTER… ',
  );

  await ctx.storageState({path: storageStatePath});
  console.info(`✓ Estado guardado en ${storageStatePath}`);

  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
