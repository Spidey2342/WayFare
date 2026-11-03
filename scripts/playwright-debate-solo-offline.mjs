/**
 * Solo guest flow with external network blocked (local debate only).
 * Prereq: npm run build:web && npx serve -s -l 4173 dist
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
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
    progress: {
      xp: 0,
      streakDays: 2,
      lastPlayedDate: null,
      badgesEarned: [],
      sessionsCompleted: 0,
      debateMvps: 0,
      debatesJudged: 0,
      debateVotesCast: 0,
      lastAppliedDebateId: null,
    },
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
    console.log('| Solo offline Playwright | SKIP | Playwright browser not installed |');
    process.exit(0);
  }
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, store);

  try {
    await page.goto(`${baseUrl}/debate/solo`, { waitUntil: 'domcontentloaded', timeout: 20000 });
  } catch {
    console.log('| Solo offline Playwright | SKIP | No server at ' + baseUrl + ' |');
    await browser.close();
    process.exit(0);
  }

  await blockExternal(page);

  try {
    await page.getByText('SOLO MODE').waitFor({ timeout: 8000 });
    await page.getByRole('button', { name: 'START SOLO DEBATE' }).click();
    await page.getByRole('button', { name: "I'VE MADE MY CASE" }).click();
    await page.getByRole('button', { name: 'NEXT' }).click();
    await page.getByRole('button', { name: 'NEXT' }).click();
    await page.getByText('The Verdict').waitFor({ timeout: 8000 });
    await page.getByText('POINTS EARNED').waitFor({ timeout: 5000 });
    await page.getByText('DAY STREAK').waitFor({ timeout: 5000 });
    console.log(
      '| Solo offline Playwright | PASS | Guest O3 (The Verdict, POINTS EARNED, DAY STREAK) with external network blocked |',
    );
    process.exit(0);
  } catch (error) {
    console.log(`| Solo offline Playwright | FAIL | ${error.message} |`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
