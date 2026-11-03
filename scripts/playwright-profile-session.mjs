/**
 * Profile / session hygiene E2E (N2, N4, N5, N7).
 * Requires served web build at AUDIT_BASE_URL (default http://127.0.0.1:4173).
 * Signed-in flows mock Supabase RPC when EXPO_PUBLIC_SUPABASE_URL is set in .env at test time.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

import { guestStore } from './playwright-guest-store.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

const USER_A = '11111111-1111-1111-1111-111111111111';
const USER_B = '22222222-2222-2222-2222-222222222222';

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

function rpcProfile(userId, displayName) {
  return {
    profile: {
      id: userId,
      display_name: displayName,
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
    stats: {
      user_id: userId,
      xp: 0,
      streak_days: 0,
      last_active_date: null,
      solo_debates_today: 0,
      solo_day: null,
      debates_judged: 0,
      debate_mvps: 0,
    },
    badges: [],
  };
}

function installRpcMocks(page, displayNameByUserId, getActiveUserId) {
  return page.route('**/rest/v1/rpc/**', async (route) => {
    const url = route.request().url();
    const userId = getActiveUserId();
    if (url.includes('ensure_profile')) {
      const name = displayNameByUserId[userId] ?? 'Account';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(rpcProfile(userId, name)),
      });
    }
    if (url.includes('get_my_stats')) {
      const payload = rpcProfile(userId, displayNameByUserId[userId] ?? 'Account');
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ stats: payload.stats, badges: payload.badges }),
      });
    }
    return route.continue();
  });
}

async function seedStore(page, payload) {
  await page.addInitScript((data) => {
    localStorage.setItem('wayfare.store', JSON.stringify(data));
  }, payload);
}

async function seedAuth(page, supabaseUrl, userId, email) {
  const key = authStorageKey(supabaseUrl);
  await page.addInitScript(
    ({ storageKey, session }) => {
      localStorage.setItem(storageKey, JSON.stringify(session));
      localStorage.setItem('wayfare:active-user-id', session.user.id);
    },
    { storageKey: key, session: sessionJson(userId, email) },
  );
}

async function main() {
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    console.warn('Profile session E2E skipped (Playwright browser not installed).');
    process.exit(0);
  }

  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await seedStore(page, guestStore(8));

  try {
    await page.goto(`${baseUrl}/profile`, { waitUntil: 'domcontentloaded', timeout: 15000 });
  } catch {
    console.warn(`Profile session E2E skipped (no server at ${baseUrl}).`);
    await browser.close();
    process.exit(0);
  }

  // N7 — guest state
  await page.waitForTimeout(1500);
  const guestBody = await page.locator('body').innerText();
  if (!guestBody.includes('Guest')) throw new Error('N7 FAIL: expected Guest label on profile');
  if (!guestBody.includes('Sign in')) throw new Error('N7 FAIL: expected Sign in CTA');
  if (guestBody.includes('Kofi')) throw new Error('N7 FAIL: demo name Kofi visible while guest');

  // Legacy v7 demo persist heals to empty (supports N2 local half)
  await seedStore(page, {
    state: {
      ...guestStore(7).state,
      profile: { name: 'Kofi', avatarColor: '#FFB800' },
      progress: { ...guestStore(7).state.progress, xp: 999, streakDays: 12 },
    },
    version: 7,
  });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const healed = await page.locator('body').innerText();
  if (healed.includes('Kofi')) throw new Error('Legacy migrate FAIL: Kofi still visible');
  if (!healed.includes('Guest')) throw new Error('Legacy migrate FAIL: expected guest after v7 heal');

  const supabaseUrl = readSupabaseUrl();
  if (supabaseUrl) {
    const profiles = { [USER_A]: 'Playwright User A', [USER_B]: 'Playwright User B' };
    let activeUserId = USER_A;
    await installRpcMocks(page, profiles, () => activeUserId);
    await page.route('**/auth/v1/**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
    );

    // N2 / signed-in display
    await seedStore(page, guestStore(8));
    activeUserId = USER_A;
    await seedAuth(page, supabaseUrl, USER_A, 'a@playwright.test');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    let text = await page.locator('body').innerText();
    if (!text.includes('Playwright User A')) {
      throw new Error('N2 FAIL: signed-in profile should show Playwright User A');
    }

    // N4 — switch users
    activeUserId = USER_B;
    await seedAuth(page, supabaseUrl, USER_B, 'b@playwright.test');
    await page.evaluate(() => {
      localStorage.setItem(
        'wayfare:user-stats-cache:v2:11111111-1111-1111-1111-111111111111',
        JSON.stringify({ xp: 42, streak_days: 3 }),
      );
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    text = await page.locator('body').innerText();
    if (!text.includes('Playwright User B')) throw new Error('N4 FAIL: user B not shown');
    if (text.includes('Playwright User A')) throw new Error('N4 FAIL: user A leaked');

    // N5 — clear store cache, keep auth
    await page.evaluate(() => {
      localStorage.removeItem('wayfare.store');
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith('wayfare:user-stats-cache:v2:')) localStorage.removeItem(key);
        if (key.startsWith('wayfare:user-badges-cache:v2:')) localStorage.removeItem(key);
      });
    });
    await seedStore(page, guestStore(8));
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(2500);
    text = await page.locator('body').innerText();
    if (!text.includes('Playwright User B')) throw new Error('N5 FAIL: profile not restored from Supabase mock');
  } else {
    console.warn('Signed-in profile E2E skipped (no EXPO_PUBLIC_SUPABASE_URL in .env). Guest + migrate checks passed.');
  }

  console.info('playwright-profile-session: PASS');
  await browser.close();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
