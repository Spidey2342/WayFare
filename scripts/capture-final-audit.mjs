import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'audit', 'final');
const undesignedDir = path.join(root, 'docs', 'audit', 'undesigned');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

mkdirSync(outDir, { recursive: true });
mkdirSync(undesignedDir, { recursive: true });

function appStore(overrides = {}) {
  return {
    state: {
      themePreference: 'light',
      onboarded: true,
      introSeen: true,
      preferredMode: 'pass',
      profile: { name: 'Kofi', avatarColor: '#FFB800' },
      installPromptDismissed: true,
      guidelinesSeen: true,
      seenRules: { debate: true, 'card-game': true },
      foundingMember: false,
      notifyInterest: false,
      favoriteDeckIds: [],
      progress: {
        xp: 120,
        streakDays: 3,
        lastPlayedDate: '2026-11-01',
        cardsPlayed: 12,
        actsOfService: 2,
        sessionsCompleted: 4,
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
    version: 7,
  };
}

const viewports = [
  { suffix: '390x844', width: 390, height: 844 },
  { suffix: '360x640', width: 360, height: 640 },
  { suffix: '430x932', width: 430, height: 932 },
];

const routes = [
  { file: 'welcome', path: '/welcome', store: appStore({ introSeen: false }) },
  { file: 'how-it-works', path: '/how-it-works', store: appStore({ introSeen: false }) },
  { file: 'choose-mode', path: '/choose-mode', store: appStore({ introSeen: false }) },
  { file: 'home', path: '/home', store: appStore() },
  { file: 'debate-hub', path: '/debate', store: appStore() },
  { file: 'debate-solo-setup', path: '/debate/solo', store: appStore() },
];

async function seedStore(page, store) {
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, store);
}

async function main() {
  const browser = await chromium.launch();
  for (const route of routes) {
    for (const vp of viewports) {
      const context = await browser.newContext({
        ...devices['iPhone 13'],
        viewport: { width: vp.width, height: vp.height },
        colorScheme: 'light',
      });
      const page = await context.newPage();
      await seedStore(page, route.store);
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle' });
      await page.waitForTimeout(600);
      const out = path.join(outDir, `${route.file}-${vp.suffix}.png`);
      await page.screenshot({ path: out, fullPage: true });
      await context.close();
    }
  }
  await browser.close();
  console.log(`Saved screenshots to ${outDir}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
