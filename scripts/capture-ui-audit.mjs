import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'audit');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

mkdirSync(outDir, { recursive: true });

function appStore(overrides = {}) {
  return {
    state: {
      themePreference: 'system',
      onboarded: true,
      preferredMode: 'pass',
      profile: { name: 'Kofi', avatarColor: '#FFB800' },
      installPromptDismissed: true,
      guidelinesSeen: true,
      foundingMember: false,
      notifyInterest: false,
      favoriteDeckIds: [],
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
      },
      hydrated: true,
      ...overrides,
    },
    version: 2,
  };
}

const captures = [
  {
    file: 'onboarding-welcome.png',
    design: 'Onboarding Flow · Welcome',
    path: '/welcome',
    store: appStore({ onboarded: false, preferredMode: null }),
    colorScheme: 'light',
  },
  {
    file: 'onboarding-how-it-works.png',
    design: 'Onboarding Flow · Grow as you go',
    path: '/how-it-works',
    store: appStore({ onboarded: false }),
    colorScheme: 'light',
  },
  {
    file: 'onboarding-choose-mode.png',
    design: 'Onboarding Flow · Start your adventure',
    path: '/choose-mode',
    store: appStore({ onboarded: false }),
    colorScheme: 'light',
  },
  {
    file: 'home.png',
    design: 'Home & Decks · Home feed',
    path: '/home',
    store: appStore({ themePreference: 'system' }),
    colorScheme: 'dark',
  },
  {
    file: 'home-system-dark-emulation.png',
    design: 'Home (should still be light per spec)',
    path: '/home',
    store: appStore({ themePreference: 'system' }),
    colorScheme: 'dark',
  },
  {
    file: 'explore-decks.png',
    design: 'Home & Decks · Explore Decks',
    path: '/decks',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'deck-detail-identity.png',
    design: 'Home & Decks · Deck detail',
    path: '/deck/identity',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'setup-game.png',
    design: 'Gameplay Flow · Setup game',
    path: '/setup',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'dice.png',
    design: 'Gameplay Flow · Roll for destiny',
    path: '/game/dice',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'leaderboard.png',
    design: 'Gameplay Flow · Leaderboard',
    path: '/game/leaderboard',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'session-complete.png',
    design: 'Final Screens · Amazing session',
    path: '/game/complete',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'share-moment.png',
    design: 'Final Screens · Share to community',
    path: '/share',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'journey.png',
    design: 'Final Screens · Your journey',
    path: '/journey',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'profile.png',
    design: 'Final Screens · Profile & settings',
    path: '/profile',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'community.png',
    design: 'Community teaser (Home link)',
    path: '/community',
    store: appStore(),
    colorScheme: 'light',
  },
  {
    file: 'style-guide-dev-kit.png',
    design: 'Style Guide & UI Kit',
    path: '/dev/kit',
    store: appStore(),
    colorScheme: 'light',
  },
];

async function captureOne(browser, item) {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: item.colorScheme,
  });
  const page = await context.newPage();
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, item.store);
  await page.goto(`${baseUrl}${item.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(2500);
  const target = path.join(outDir, item.file);
  await page.screenshot({ path: target, fullPage: true });
  await context.close();
  return target;
}

async function captureGameplay(browser) {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, appStore());
  await page.goto(`${baseUrl}/setup`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /start game/i }).click();
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: /draw card/i }).click();
  await page.waitForTimeout(1500);
  const target = path.join(outDir, 'gameplay-active.png');
  await page.screenshot({ path: target, fullPage: true });
  await context.close();
  return target;
}

const browser = await chromium.launch();
try {
  for (const item of captures) {
    const saved = await captureOne(browser, item);
    console.log(`Saved ${saved}`);
  }
  const gameplay = await captureGameplay(browser);
  console.log(`Saved ${gameplay}`);
} finally {
  await browser.close();
}
