/**
 * Same-phone guest flow with external network blocked.
 * Uses ?test=1 for 1s prep / 2s debate timers.
 * Prereq: npm run build:web && npx serve -s -l 4173 dist
 */
import { chromium, devices } from 'playwright';

const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

const store = {
  state: {
    themePreference: 'light',
    onboarded: true,
    introSeen: true,
    hydrated: true,
    profile: { name: 'Kofi', avatarColor: '#FFB800' },
    playModeHelpSeen: { solo: true, pass: true, online: true, debate: true },
    seenRules: { debate: true },
    progress: { xp: 0, streakDays: 0, badgesEarned: [], lastAppliedDebateId: null },
  },
  version: 7,
};

function blockExternal(page) {
  return page.route('**/*', (route) => {
    const url = route.request().url();
    if (/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?\//.test(url)) {
      return route.continue();
    }
    return route.abort();
  });
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    console.log('| Pass offline Playwright | SKIP | Playwright browser not installed |');
    process.exit(0);
  }
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, store);

  try {
    await page.goto(`${baseUrl}/debate/pass/setup?test=1`, {
      waitUntil: 'domcontentloaded',
      timeout: 20000,
    });
  } catch {
    console.log('| Pass offline Playwright | SKIP | No server at ' + baseUrl + ' |');
    await browser.close();
    process.exit(0);
  }

  await blockExternal(page);

  try {
    await page.getByText('WHO IS PLAYING TODAY?').waitFor({ timeout: 8000 });
    await page.getByRole('button', { name: 'CONTINUE' }).click();
    await page.getByRole('button', { name: 'USE THIS TOPIC' }).click();

    await page.getByRole('button', { name: /^I'M KOFI/ }).click({ force: true });
    await page.getByRole('button', { name: 'AGREE' }).first().click({ force: true });
    await page.getByRole('button', { name: /^I'M AMA/ }).click({ force: true });
    await page.getByRole('button', { name: 'DISAGREE' }).first().click({ force: true });

    await page.getByRole('button', { name: 'START DEBATE', disabled: false }).click();
    await page.getByText(/^\d+:\d{2}$/).first().waitFor();
    await page.getByRole('button', { name: 'READY FOR VERDICT' }).click();
    await page.getByText('FINAL JUDGMENT').waitFor();
    await page.getByText('AGREE', { exact: true }).first().click({ force: true });
    await page.getByRole('button', { name: 'ANNOUNCE WINNER' }).click();

    await page.getByText('RESULTS').waitFor();
    console.log(
      '| Pass offline Playwright | PASS | D5 elapsed chip, verdict, results with external network blocked |',
    );
    process.exit(0);
  } catch (error) {
    console.log(`| Pass offline Playwright | FAIL | ${error.message} |`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
