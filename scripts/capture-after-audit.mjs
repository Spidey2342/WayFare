import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'audit', 'after');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

mkdirSync(outDir, { recursive: true });

function appStore() {
  return {
    state: {
      themePreference: 'light',
      onboarded: true,
      preferredMode: 'pass',
      profile: { name: 'Kofi', avatarColor: '#FFB800' },
      installPromptDismissed: true,
      guidelinesSeen: true,
      foundingMember: false,
      notifyInterest: false,
      favoriteDeckIds: [],
      progress: {
        xp: 40,
        streakDays: 3,
        lastPlayedDate: '2026-10-30',
        cardsPlayed: 12,
        actsOfService: 2,
        sessionsCompleted: 3,
        completedWeeks: ['w1'],
        badgesEarned: ['first-step', 'scripture-seeker', 'hot-start'],
        wordCards: 3,
        questionCards: 2,
        dareCards: 2,
        challengeCards: 1,
        testimonyCards: 1,
        weeklyCompleted: false,
        weeklyWeekKey: '2026-W44',
        lastAppliedSessionId: null,
        completedLessons: ['identity-lesson-1'],
        booksRead: ['genesis'],
        quizzesCompleted: 1,
      },
      hydrated: true,
    },
    version: 4,
  };
}

const shots = [
  { file: 'profile.png', path: '/profile' },
  { file: 'journey.png', path: '/journey' },
  { file: 'home.png', path: '/home' },
];

const browser = await chromium.launch();
try {
  for (const shot of shots) {
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
    await page.goto(`${baseUrl}${shot.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
    await page.waitForTimeout(2000);
    const target = path.join(outDir, shot.file);
    await page.screenshot({ path: target, fullPage: true });
    await context.close();
    console.log(`Saved ${target}`);
  }
} finally {
  await browser.close();
}
