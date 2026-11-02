# QA checklist

## Debate — same phone (automated)

1. Serve web build: `npx serve dist -l 4173` (after `npm run build:web`).
2. Run: `node scripts/playwright-debate-pass.mjs`.
3. Expect: lobby → sides → prep → debate → pass-to vote screen without errors.

## Debate — online (manual, two devices)

Requires Supabase migration `0002_debate.sql` and signed-in users.

1. User A (host): Group lobby → **Start debate** (or create session via SQL/API).
2. Note 6-character **room code** on lobby screen.
3. User B: **Debate → Join online room** → enter code.
4. Both tap **Ready up**; host taps **Start debate** twice (prep, then debate) using **Continue** if needed.
5. During debate, both tap **Ready to Vote** or wait for timer; host may **End debate early**.
6. Each player votes for someone else; confirm results and XP on profiles.

Optional: set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in CI to add a two-context Playwright test later.

## Debate — solo (guest)

1. Open `/debate/solo` without signing in.
2. Pick topic, prep notes, both 60s sides, reflection, finish.
3. Confirm XP increases locally on home/journey.

## Regression

- `npm run typecheck`, `npm run lint`, `npm test`, `npm run build:web`
- Emoji scan passes
- Light theme default on non-gameplay routes
