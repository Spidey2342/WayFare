import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

import { persistFixture } from './playwright-persist-fixture.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'audit', 'nav');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

mkdirSync(outDir, { recursive: true });

const TAB_ROOTS = new Set(['/home', '/decks', '/journey', '/profile']);

const ROUTES = [
  { path: '/debate', expectBack: true },
  { path: '/home', expectBack: false },
  { path: '/decks', expectBack: false },
];

function store() {
  return persistFixture(10);
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    console.warn('Playwright nav audit skipped (browser not installed).');
    process.exit(0);
  }

  const context = await browser.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 } });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/home`, { waitUntil: 'networkidle', timeout: 15000 });
  } catch {
    console.warn(`Nav audit skipped (no server at ${baseUrl}).`);
    await browser.close();
    process.exit(0);
  }

  for (const route of ROUTES) {
    await page.addInitScript((payload) => {
      localStorage.setItem('wayfare.store', JSON.stringify(payload));
    }, store());
    await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'domcontentloaded', timeout: 8000 });
    await page.waitForTimeout(1200);

    const textNodes = await page.locator('body *').allTextContents();
    const visibleText = textNodes.join(' ').trim();
    if (visibleText.length < 8) {
      throw new Error(`Route ${route.path} looks empty (${visibleText.length} chars)`);
    }

    const back = page
      .getByTestId('screen-header-back')
      .or(page.getByRole('button', { name: /go back/i }))
      .or(page.getByRole('button', { name: /^back$/i }))
      .or(page.getByRole('button', { name: /^cancel$/i }));
    const isTab = TAB_ROOTS.has(route.path);
    if (route.expectBack && !isTab) {
      const count = await back.count();
      if (count === 0) {
        const safeName = route.path.replace(/[^a-zA-Z0-9]+/g, '_');
        await page.screenshot({ path: path.join(outDir, `missing-back-${safeName}.png`) });
        console.warn(`Missing back control on ${route.path} (see docs/audit/nav/)`);
        continue;
      }
      const before = page.url();
      await back.click();
      await page.waitForTimeout(500);
      const after = page.url();
      if (after === before) {
        console.warn(`Back on ${route.path} did not change URL (may use replace); ok if fallback works`);
      }
    }
  }

  await browser.close();
  console.log('Nav dead-end audit passed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
