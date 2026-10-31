import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium, devices } from 'playwright';

import { EMOJI_REGEX, loadAllowlist, repoRoot } from './emoji-scanner.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = repoRoot();
const allowlist = loadAllowlist(root);
const baseUrl = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

function isAllowedText(text) {
  if (!text) return true;
  for (const match of text.matchAll(EMOJI_REGEX)) {
    const character = match[0];
    if (allowlist.characters.has(character)) continue;
    let allowed = false;
    for (const pattern of allowlist.patterns) {
      if (pattern.test(text)) {
        allowed = true;
        break;
      }
    }
    if (!allowed) return false;
  }
  return true;
}

function appStore(overrides = {}) {
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
        streakDays: 2,
        lastPlayedDate: '2026-10-30',
        cardsPlayed: 6,
        actsOfService: 1,
        sessionsCompleted: 2,
        completedWeeks: ['w1'],
        badgesEarned: ['first-step', 'scripture-seeker'],
        wordCards: 2,
        questionCards: 2,
        dareCards: 1,
        challengeCards: 0,
        testimonyCards: 1,
        weeklyCompleted: false,
        weeklyWeekKey: '2026-W44',
        lastAppliedSessionId: null,
        completedLessons: ['identity-lesson-1'],
        booksRead: ['genesis'],
        quizzesCompleted: 0,
      },
      hydrated: true,
      ...overrides,
    },
    version: 4,
  };
}

const routes = [
  { path: '/welcome', store: appStore({ onboarded: false, preferredMode: null }) },
  { path: '/how-it-works', store: appStore({ onboarded: false }) },
  { path: '/choose-mode', store: appStore({ onboarded: false }) },
  { path: '/home', store: appStore() },
  { path: '/decks', store: appStore() },
  { path: '/deck/identity', store: appStore() },
  { path: '/setup', store: appStore() },
  { path: '/game/dice', store: appStore() },
  { path: '/game/leaderboard', store: appStore() },
  { path: '/game/complete', store: appStore() },
  { path: '/share', store: appStore() },
  { path: '/journey', store: appStore() },
  { path: '/profile', store: appStore() },
  { path: '/community', store: appStore() },
  { path: '/learn', store: appStore() },
  { path: '/learn/books', store: appStore() },
  { path: '/learn/quiz', store: appStore() },
  { path: '/learn/quiz/play?category=mixed&mode=solo', store: appStore() },
  { path: '/learn/lesson/identity-lesson-1', store: appStore() },
];

async function collectVisibleStrings(page) {
  return page.evaluate(() => {
    const values = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node = walker.currentNode;
    while (node) {
      const element = node;
      if (element instanceof HTMLElement) {
        if (element.innerText) values.push(element.innerText);
        for (const attr of ['aria-label', 'title', 'placeholder', 'alt']) {
          const value = element.getAttribute(attr);
          if (value) values.push(value);
        }
      }
      node = walker.nextNode();
    }
    return values;
  });
}

async function auditRoute(browser, route) {
  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    colorScheme: 'light',
  });
  const page = await context.newPage();
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, route.store);
  await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForTimeout(1500);
  const strings = await collectVisibleStrings(page);
  const violations = [];
  for (const text of strings) {
    if (!isAllowedText(text)) violations.push({ path: route.path, text: text.slice(0, 120) });
  }
  await context.close();
  return violations;
}

async function auditGameplay(browser) {
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
  await page.getByRole('button', { name: /start game/i }).click();
  await page.waitForTimeout(2000);
  const strings = await collectVisibleStrings(page);
  const violations = [];
  for (const text of strings) {
    if (!isAllowedText(text)) violations.push({ path: '/game/[sessionId]', text: text.slice(0, 120) });
  }
  await context.close();
  return violations;
}

mkdirSync(path.join(root, 'docs', 'audit', 'after'), { recursive: true });

const browser = await chromium.launch();
const allViolations = [];
try {
  for (const route of routes) {
    const hits = await auditRoute(browser, route);
    allViolations.push(...hits);
    console.log(`${route.path}: ${hits.length} emoji violation(s)`);
  }
  allViolations.push(...(await auditGameplay(browser)));
} finally {
  await browser.close();
}

if (allViolations.length > 0) {
  for (const hit of allViolations) {
    console.error(`${hit.path} -> ${hit.text}`);
  }
  process.exit(1);
}

console.log('Playwright emoji audit: OK on all routes.');
