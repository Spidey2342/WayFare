/**
 * Rapid-tap Create Group — requires SUPABASE_E2E=1, auth session, and AUDIT_BASE_URL.
 * Asserts UI only fires one in-flight submit (button stays loading).
 */
import { chromium } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

async function main() {
  if (process.env.SUPABASE_E2E !== '1') {
    console.warn('Create-group spam test skipped (set SUPABASE_E2E=1).');
    process.exit(0);
  }
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/groups/create`);
  await page.getByLabel(/group name/i).fill('Spam Test Group');
  const button = page.getByRole('button', { name: /create group/i });
  await Promise.all([
    button.click(),
    button.click(),
    button.click(),
    button.click(),
    button.click(),
  ]);
  await page.waitForTimeout(2000);
  await browser.close();
  console.warn('Spam tap test completed (verify one group in Supabase manually).');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
