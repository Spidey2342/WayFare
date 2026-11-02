import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const lobbyDir = path.join(root, 'docs', 'audit', 'lobby');
const navDir = path.join(root, 'docs', 'audit', 'nav');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

mkdirSync(lobbyDir, { recursive: true });
mkdirSync(navDir, { recursive: true });

const MOCK_GROUP_ID = '11111111-1111-1111-1111-111111111111';

async function seed(page, lobbyState) {
  await page.addInitScript(
    ({ store, mockLobby }) => {
      localStorage.setItem('wayfare.store', JSON.stringify(store));
      window.__WAYFARE_MOCK_LOBBY__ = mockLobby;
    },
    {
      store: {
        state: { themePreference: 'light', introSeen: true, onboarded: true, hydrated: true, profile: { name: 'Kofi', avatarColor: '#FFB800' }, progress: { xp: 0, streakDays: 0, lastPlayedDate: null, cardsPlayed: 0, actsOfService: 0, sessionsCompleted: 0, completedWeeks: [], badgesEarned: [], wordCards: 0, questionCards: 0, dareCards: 0, challengeCards: 0, testimonyCards: 0, weeklyCompleted: false, weeklyWeekKey: '2026-W44', lastAppliedSessionId: null } },
        version: 7,
      },
      mockLobby: lobbyState,
    },
  );
}

async function shot(page, file) {
  await page.screenshot({ path: path.join(lobbyDir, file), fullPage: true });
}

async function main() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
  });

  for (const [file, pathSuffix] of [
    ['lobby-1-member-390x844.png', '/dev/lobby-preview?members=1'],
    ['lobby-3-members-390x844.png', '/dev/lobby-preview?members=3'],
  ]) {
    const page = await context.newPage();
    await page.goto(`${baseUrl}${pathSuffix}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);
    await shot(page, file);
  }

  const errorPage = await context.newPage();
  await seed(errorPage, null);
  await errorPage.goto(`${baseUrl}/groups/${MOCK_GROUP_ID}/lobby`, { waitUntil: 'domcontentloaded' });
  await errorPage.waitForTimeout(800);
  await shot(errorPage, 'lobby-error-390x844.png');

  const navPage = await context.newPage();
  await navPage.goto(`${baseUrl}/dev/lobby-preview?members=1`, { waitUntil: 'domcontentloaded' });
  await navPage.waitForTimeout(400);
  await navPage.screenshot({ path: path.join(navDir, 'lobby-header-back-390x844.png'), fullPage: true });

  await browser.close();
  console.log(`Lobby audit saved to ${lobbyDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
