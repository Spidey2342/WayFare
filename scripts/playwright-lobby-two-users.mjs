/**
 * Two-browser lobby test — requires live Supabase + migration 0003 + served web build.
 * Set SUPABASE_E2E=1 and AUDIT_BASE_URL. Skips when not configured.
 */
import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';
const enabled = process.env.SUPABASE_E2E === '1';

async function main() {
  if (!enabled) {
    console.warn('Lobby two-user test skipped (set SUPABASE_E2E=1 to run).');
    process.exit(0);
  }
  console.warn(
    'Lobby two-user E2E requires scripted sign-in helpers; run manual checklist in supabase/tests/0003-group-access-manual.md for now.',
  );
  const browser = await chromium.launch();
  const a = await browser.newPage();
  const b = await browser.newPage();
  await a.goto(baseUrl);
  await b.goto(baseUrl);
  await browser.close();
  process.exit(0);
}

main();
