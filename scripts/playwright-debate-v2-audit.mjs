/**
 * Debate V2 frame audit — 390×844, verbatim strings, screenshots.
 * Prereq: npm run build:web && npx serve -s -l 4173 dist
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium, devices } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const outDir = path.join(root, 'docs', 'audit', 'debate-v2');
const base = process.env.AUDIT_BASE_URL ?? 'http://127.0.0.1:4173';

const STORE = {
  state: {
    themePreference: 'light',
    onboarded: true,
    introSeen: true,
    hydrated: true,
    profile: { name: 'Guest', avatarColor: '#FFB800' },
    seenRules: { debate: true },
    playModeHelpSeen: { solo: true, pass: true, online: true, debate: true },
    progress: { xp: 0, streakDays: 0, badgesEarned: [] },
  },
  version: 7,
};

/** @type {Record<string, { path: string, strings: string[] }>} */
const FRAMES = {
  D1: { path: '/dev/debate-v2/D1', strings: ['USE THIS TOPIC', 'SHUFFLE TOPIC', 'Be sharp, be kind'] },
  D2: { path: '/dev/debate-v2/D2', strings: ['LEADER IS CHOOSING A TOPIC...'] },
  D3: { path: '/dev/debate-v2/D3', strings: ['CHOOSE SIDES', 'START DEBATE', 'THE JUDGE'] },
  D4: { path: '/dev/debate-v2/D4', strings: ['CHOOSE YOUR SIDE', 'WAITING FOR LEADER TO START', 'WAITING FOR OTHERS...'] },
  D5: { path: '/dev/debate-v2/D5', strings: ['READY FOR VERDICT', 'CURRENT TOPIC'] },
  D6: { path: '/dev/debate-v2/D6', strings: ['FINAL JUDGMENT', 'ANNOUNCE WINNER', '+2 PTS'] },
  D7: { path: '/dev/debate-v2/D7', strings: ['DEBATE CONCLUDED', 'The leader is deciding...'] },
  D8: { path: '/dev/debate-v2/D8', strings: ['RESULTS', 'ANOTHER TOPIC', 'BACK TO GROUP'] },
  D9: { path: '/dev/debate-v2/D9', strings: ['YOUR RESULTS'] },
  D10: { path: '/dev/debate-v2/D10', strings: ['YOU ARE OFFLINE', 'Incomplete', 'Reconnecting', 'Add more players'] },
  'D3-12': { path: '/dev/debate-v2/D3-12', strings: ['+1', 'CHOOSE SIDES'] },
  'D4-12': { path: '/dev/debate-v2/D4-12', strings: ['+1', 'CHOOSE YOUR SIDE'] },
  'D5-12': { path: '/dev/debate-v2/D5-12', strings: ['+1', 'READY FOR VERDICT'] },
  S1: { path: '/debate/pass/setup?test=1', strings: ['WHO IS PLAYING TODAY?', 'CONTINUE'] },
  S2: { path: '/dev/debate-v2/S2', strings: ['Pass the phone to', "I'M"] },
  S3: { path: '/dev/debate-v2/S3', strings: ['Ready?', 'START DEBATE'] },
  O1: { path: '/debate/solo', strings: ['SOLO MODE', 'START SOLO DEBATE'] },
  O2: { path: '/dev/debate-v2/O2', strings: ['Make Your Case', "I'VE MADE MY CASE"] },
  O3: { path: '/dev/debate-v2/O3', strings: ['The Verdict', 'POINTS EARNED', 'DAY STREAK'] },
  A1: { path: '/dev/auth-frame/A1', strings: ['Create Account', 'EMAIL ADDRESS', 'CONTINUE'] },
  A2: { path: '/dev/auth-frame/A2', strings: ['Welcome back', 'YOUR PASSWORD', 'LOG IN'] },
  A3: { path: '/dev/debate-v2/A3', strings: ['Keep your XP and badges?', 'KEEP MY PROGRESS', 'START FRESH'] },
};

async function main() {
  await mkdir(outDir, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch();
  } catch {
    console.log('DEBATE_V2_AUDIT SKIP (no browser)');
    process.exit(0);
  }

  const context = await browser.newContext({
    ...devices['iPhone 13'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();
  await page.addInitScript((payload) => {
    localStorage.setItem('wayfare.store', JSON.stringify(payload));
  }, STORE);

  /** @type {Record<string, { status: string, missing?: string[] }>} */
  const report = {};

  for (const [id, spec] of Object.entries(FRAMES)) {
    const url = `${base}${spec.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
      await page.waitForTimeout(1200);
      const missing = [];
      for (const text of spec.strings) {
        const locator = page.getByText(text, { exact: false }).first();
        if (!(await locator.isVisible().catch(() => false))) missing.push(text);
      }
      const shot = path.join(outDir, `${id}.png`);
      await page.screenshot({ path: shot, fullPage: true });
      report[id] = missing.length === 0 ? { status: 'PASS' } : { status: 'FAIL', missing };
      console.log(`| ${id} | ${report[id].status}${missing.length ? ` | missing: ${missing.join('; ')}` : ''} |`);
    } catch (error) {
      report[id] = { status: 'FAIL', missing: [error.message] };
      console.log(`| ${id} | FAIL | ${error.message}`);
    }
  }

  await writeFile(path.join(outDir, 'audit-report.json'), JSON.stringify(report, null, 2));
  await browser.close();
  const failed = Object.values(report).filter((row) => row.status !== 'PASS').length;
  process.exit(failed > 0 ? 1 : 0);
}

main();
