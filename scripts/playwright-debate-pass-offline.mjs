/**
 * Same-phone signed-in flow with external network blocked.
 * Uses ?test=1 for 1s prep / 2s debate timers.
 * Prereq: npm run build:web && npx serve -s -l 4173 dist
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';
const USER_A = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';

function readSupabaseUrl() {
  try {
    const raw = readFileSync(path.join(root, '.env'), 'utf8');
    const line = raw.split('\n').find((row) => row.startsWith('EXPO_PUBLIC_SUPABASE_URL='));
    if (!line) return null;
    const value = line.split('=').slice(1).join('=').trim();
    return value.length > 0 ? value : null;
  } catch {
    return null;
  }
}

function authStorageKey(supabaseUrl) {
  const ref = new URL(supabaseUrl).hostname.split('.')[0];
  return `supabase:sb-${ref}-auth-token`;
}

function sessionJson(userId, email) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: 'playwright-test-access',
    refresh_token: 'playwright-test-refresh',
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: 'bearer',
    user: { id: userId, aud: 'authenticated', role: 'authenticated', email },
  };
}

const store = {
  state: {
    themePreference: 'light',
    onboarded: true,
    introSeen: true,
    hydrated: true,
    profile: { name: '', avatarColor: '' },
    playModeHelpSeen: { solo: true, pass: true, online: true, debate: true },
    seenRules: { debate: true },
    progress: { xp: 0, streakDays: 0, badgesEarned: [], lastAppliedDebateId: null },
  },
  version: 10,
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

async function addPlayer(page, name) {
  const add = page.getByTestId('pass-setup-add');
  if (await add.isVisible().catch(() => false)) await add.click();
  await page.getByTestId('pass-setup-name-input').fill(name);
  await page.getByTestId('pass-setup-add-confirm').click();
}

async function main() {
  const supabaseUrl = readSupabaseUrl();
  if (!supabaseUrl) {
    console.log('| Pass offline Playwright | SKIP | No .env Supabase URL |');
    process.exit(0);
  }

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

  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/token') || url.includes('/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sessionJson(USER_A, 'offline@test.local')),
      });
    }
    return route.continue();
  });

  await page.route('**/rest/v1/rpc/ensure_profile**', async (route) => {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        profile: {
          id: USER_A,
          display_name: 'Kofi',
          avatar_key: 'sunrise',
          age_confirmed: true,
          tutorial_completed: true,
        },
      }),
    });
  });

  await page.addInitScript(
    ({ payload, authKey, session }) => {
      localStorage.setItem('wayfare.store', JSON.stringify(payload));
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    {
      payload: store,
      authKey: authStorageKey(supabaseUrl),
      session: sessionJson(USER_A, 'offline@test.local'),
    },
  );

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
    await addPlayer(page, 'Ama');
    await addPlayer(page, 'Sam');
    await page.getByTestId('pass-setup-continue').click();
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
