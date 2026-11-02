import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

const store = {
  state: {
    themePreference: 'light',
    onboarded: true,
    profile: { name: 'Kofi', avatarColor: '#FFB800' },
    playModeHelpSeen: { solo: true, pass: true, online: true, debate: true },
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
      weeklyWeekKey: '2026-W45',
      lastAppliedSessionId: null,
      completedLessons: [],
      booksRead: [],
      quizzesCompleted: 0,
      debateVotesCast: 0,
      debateMvps: 0,
      lastAppliedDebateId: null,
    },
  },
  version: 6,
};

async function seed(page) {
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, store);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await seed(page);
  await page.goto(`${baseUrl}/debate/pass/setup?test=1`);
  await page.getByRole('button', { name: 'Start lobby' }).click();
  await page.getByRole('button', { name: 'Reveal sides' }).click();
  await page.getByRole('button', { name: 'Start prep' }).click();
  await page.getByRole('button', { name: 'Start debate' }).click();
  await page.getByRole('button', { name: 'Host: end debate' }).click();
  await page.getByText('Pass to').first().waitFor({ timeout: 5000 });
  await browser.close();
  console.log('Pass debate flow: OK');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
