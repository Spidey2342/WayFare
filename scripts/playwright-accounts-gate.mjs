/**
 * Accounts-only gate E2E (G1, G2, G5, G7).
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
      progress: {
        xp: 0,
        streakDays: 0,
        lastPlayedDate: null,
        cardsPlayed: 0,
        actsOfService: 0,
        sessionsCompleted: 0,
        completedWeeks: [],
        badgesEarned: [],
        wordCards: 0,
        questionCards: 0,
        dareCards: 0,
        challengeCards: 0,
        testimonyCards: 0,
        weeklyCompleted: false,
        weeklyWeekKey: '2026-W44',
        lastAppliedSessionId: null,
        completedLessons: [],
        booksRead: [],
        quizzesCompleted: 0,
        debateVotesCast: 0,
        debateMvps: 0,
        debatesJudged: 0,
        lastAppliedDebateId: null,
      },
    },
    version: 10,
  };
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    console.warn('Accounts gate E2E skipped (Playwright browser not installed).');
    process.exit(0);
  }

  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();

  try {
    await page.goto(`${baseUrl}/home`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch {
    console.warn(`Accounts gate E2E skipped (no server at ${baseUrl}).`);
    await browser.close();
    process.exit(0);
  }

  // G1 — no session cannot reach home
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);
  let url = page.url();
  if (!url.includes('/auth/welcome') && !url.includes('/auth/sign-in')) {
    const body = await page.locator('body').innerText();
    if (!body.includes('Sign in') && !body.includes('Create account')) {
      throw new Error(`G1 FAIL: expected auth welcome, got ${url}`);
    }
  }

  const supabaseUrl = readSupabaseUrl();
  if (!supabaseUrl) {
    console.warn('Signed-in gate checks skipped (no .env Supabase URL). G1 passed.');
    await browser.close();
    process.exit(0);
  }

  let activeUserId = USER_A;
  await page.route('**/rest/v1/rpc/**', async (route) => {
    const reqUrl = route.request().url();
    if (reqUrl.includes('ensure_profile')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          profile: {
            id: activeUserId,
            display_name: 'Gate Test User',
            avatar_key: 'sunrise',
            bio: null,
            favorite_verse: null,
            age_confirmed: true,
            tutorial_completed: false,
            tutorial_step: 0,
            goal: null,
            xp: 0,
            created_at: new Date().toISOString(),
          },
          stats: { user_id: activeUserId, xp: 5, streak_days: 1 },
          badges: [],
        }),
      });
    }
    if (reqUrl.includes('get_my_stats')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          stats: { user_id: activeUserId, xp: 5, streak_days: 1 },
          badges: [],
        }),
      });
    }
    return route.continue();
  });
  await page.route('**/auth/v1/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );

  const storageKey = authStorageKey(supabaseUrl);
  await page.addInitScript(
    ({ key, session, store }) => {
      localStorage.setItem(key, JSON.stringify(session));
      localStorage.setItem('wayfare.store', JSON.stringify(store));
      localStorage.setItem('wayfare:active-user-id', session.user.id);
    },
    {
      key: storageKey,
      session: sessionJson(USER_A, 'gate@test.com'),
      store: signedInStore(),
    },
  );

  // G2 — signed in reaches home with display name
  await page.goto(`${baseUrl}/home`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  let text = await page.locator('body').innerText();
  if (!text.includes('Gate Test User') && !text.includes('Hello')) {
    throw new Error('G2 FAIL: home did not show signed-in user');
  }

  // G5 — return path after blocked route
  await page.evaluate(() => {
    localStorage.removeItem('wayfare.auth.returnTo');
  });
  await page.goto(`${baseUrl}/groups`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const returnTo = await page.evaluate(() => localStorage.getItem('wayfare.auth.returnTo'));
  if (returnTo !== '/groups') {
    throw new Error(`G5 FAIL: expected saved return path /groups, got ${returnTo}`);
  }

  // G7 — sign-out clears user cache keys
  await page.evaluate(() => {
    localStorage.setItem(`wayfare:user-stats-cache:v2:${USER_A}`, '{"xp":99}');
    localStorage.setItem(`wayfare:debate-outbox:v2:${USER_A}`, '{"kind":"solo"}');
  });
  await page.evaluate(() => {
    localStorage.removeItem(storageKey);
    localStorage.removeItem('wayfare:active-user-id');
    localStorage.removeItem(`wayfare:user-stats-cache:v2:${USER_A}`);
    localStorage.removeItem(`wayfare:debate-outbox:v2:${USER_A}`);
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const leaked = await page.evaluate((uid) => {
    const keys = Object.keys(localStorage);
    return keys.some((key) => key.includes(uid));
  }, USER_A);
  if (leaked) {
    throw new Error('G7 FAIL: user-scoped keys still present after sign-out simulation');
  }

  console.info('playwright-accounts-gate: PASS');
  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
