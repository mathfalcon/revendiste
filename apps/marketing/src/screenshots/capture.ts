/**
 * Playwright helper: capture UI for carousel / social proof slides.
 * Requires the frontend dev server: `pnpm dev` from repo root (or FRONTEND_URL).
 */
import 'dotenv/config';
import {mkdirSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {chromium} from 'playwright';

const marketingRoot = join(dirname(fileURLToPath(import.meta.url)), '../..');
const outDir = join(marketingRoot, 'output', 'screenshots');

async function main() {
  const base = process.env.FRONTEND_URL ?? 'http://127.0.0.1:3000';
  mkdirSync(outDir, {recursive: true});
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: {width: 390, height: 844},
  });
  await page.goto(base, {waitUntil: 'networkidle', timeout: 60_000});
  const shot = join(outDir, 'home-9x16.png');
  await page.screenshot({path: shot, fullPage: false});
  console.info(`Wrote ${shot}`);
  await browser.close();
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
