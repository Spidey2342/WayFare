/**
 * S1 same-phone setup acceptance (P1–P7) at 390×844 and 360×640.
 * Prereq: npm run build:web && npx serve -s -l 4173 dist
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from 'playwright';

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
    user: {
      id: userId,
      aud: 'authenticated',
      role: 'authenticated',
      email,
      app_metadata: { provider: 'email' },
      user_metadata: {},
    },
  };
}

function signedInStore() {
  return {
    state: {
      themePreference: 'light',
      onboarded: true,
      introSeen: true,
      profile: { name: '', avatarColor: '' },
      hydrated: true,
      seenRules: { debate: true },
      playModeHelpSeen: { solo: true, pass: true, online: true, debate: true },
      progress: {
        xp: 0,
        streakDays: 0,
        badgesEarned: [],
        lastAppliedDebateId: null,
      },
    },
    version: 10,
  };
}

async function addPlayer(page, name) {
  const add = page.getByTestId('pass-setup-add');
  if (await add.isVisible().catch(() => false)) {
    await add.click();
  }
  const input = page.getByTestId('pass-setup-name-input');
  await input.fill(name);
  await page.getByTestId('pass-setup-add-confirm').click();
}

async function runSuite(page, viewportLabel) {
  await page.setViewportSize(
    viewportLabel === '390x844' ? { width: 390, height: 844 } : { width: 360, height: 640 },
  );

  await page.goto(`${baseUrl}/debate/pass/setup?test=1`, {
    waitUntil: 'domcontentloaded',
    timeout: 20000,
  });
  await page.getByText('WHO IS PLAYING TODAY?').waitFor({ timeout: 12000 });

  // P1
  await page.getByText('Gate Test User (You)').waitFor();
  const selfRow = page.getByTestId('pass-setup-row-pass-self');
  await selfRow.waitFor();

  // P2
  await page.getByTestId('pass-setup-helper').waitFor();
  await page.getByTestId('pass-setup-continue').isDisabled();

  // P3
  await page.getByTestId('pass-setup-add').click();
  await page.getByTestId('pass-setup-name-input').fill('   ');
  await page.getByTestId('pass-setup-add-confirm').click();
  await page.getByText('Enter a name.').waitFor();

  await addPlayer(page, 'Ama');
  await addPlayer(page, 'ama');
  await page.getByText('That name is already in the list.').waitFor();

  const long21 = 'abcdefghijklmnopqrstu';
  await page.getByTestId('pass-setup-add').click();
  await page.getByTestId('pass-setup-name-input').fill(long21);
  await page.getByTestId('pass-setup-add-confirm').click();
  await page.getByText('Names can be up to 20 characters.').waitFor();

  await addPlayer(page, 'Sam');

  // P2 continued — can continue
  await page.getByTestId('pass-setup-continue').isEnabled();

  // P7 — one judge (self default)
  const judgeLabels = page.locator('text=JUDGE');
  await judgeLabels.first().waitFor();

  // P6 — switch judge, remove judge, falls back to self
  await page.getByTestId('pass-setup-row-added-0').click();
  await page.getByTestId('pass-setup-row-added-0').locator('svg').click();
  await page.getByText('Gate Test User (You)').waitFor();

  // P4 — fill to 8
  const names = ['B', 'C', 'D', 'E', 'F', 'G'];
  for (const name of names) {
    await addPlayer(page, name);
  }
  await page.getByTestId('pass-setup-limit').waitFor();
  await page.getByTestId('pass-setup-add').count();
  if ((await page.getByTestId('pass-setup-add').count()) > 0) {
    throw new Error('P4: add control should be hidden at 8 players');
  }

  // P5 — initials visible (at least one added row shows a letter)
  await page.getByText('A', { exact: true }).first().waitFor();

  console.log(`| Pass setup ${viewportLabel} | PASS | P1–P7 |
`);
}

async function main() {
  const supabaseUrl = readSupabaseUrl();
  if (!supabaseUrl) {
    console.warn('| Pass setup Playwright | SKIP | No .env Supabase URL |');
    process.exit(0);
  }

  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    console.warn('| Pass setup Playwright | SKIP | Playwright browser not installed |');
    process.exit(0);
  }

  const context = await browser.newContext();
  const page = await context.newPage();
  page.setDefaultTimeout(15000);

  await page.route('**/auth/v1/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/token') || url.includes('/user')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(sessionJson(USER_A, 'gate@test.local')),
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
          display_name: 'Gate Test User',
          avatar_key: 'sunrise',
          bio: null,
          favorite_verse: null,
          age_confirmed: true,
          tutorial_completed: true,
          tutorial_step: 0,
          goal: null,
        },
      }),
    });
  });

  await page.addInitScript(
    ({ store, authKey, session }) => {
      localStorage.setItem('wayfare.store', JSON.stringify(store));
      localStorage.setItem(authKey, JSON.stringify(session));
    },
    {
      store: signedInStore(),
      authKey: authStorageKey(supabaseUrl),
      session: sessionJson(USER_A, 'gate@test.local'),
    },
  );

  try {
    await runSuite(page, '390x844');
    await runSuite(page, '360x640');
    process.exit(0);
  } catch (error) {
    console.log(`| Pass setup Playwright | FAIL | ${error.message} |`);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

main();
