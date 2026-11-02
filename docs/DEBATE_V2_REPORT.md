# Debate V2 + email accounts report

## Built

- **Database:** `supabase/migrations/0006_debate_v2.sql` — agree/disagree sides, judge verdict flow, topic history, caps to 20 players, RPCs (`draw_topic`, `choose_side`, `start_debate`, `publish_verdict`, etc.), `merge_guest_progress`.
- **Engine:** `src/features/debate/engine/*` with unit tests in `debate-v2-engine-test.ts`.
- **Online UI:** `OnlineDebateSession` wired from `app/debate/[sessionId].tsx` with Realtime + heartbeat + contract strings.
- **Email:** shared `normalizeEmail`, typo suggestions, duplicate sign-up notice, last-used email on device, reset/sign-in normalization.
- **Rules:** `gameRules.ts` updated; Fair Judge badge → judge 5 debates.

## SQL to run

After 0001, 0002, 0003, 0004, 0005 (if needed):

[`supabase/migrations/0006_debate_v2.sql`](../supabase/migrations/0006_debate_v2.sql)

## Tests

- `npm test` — includes debate v2 engine + email auth tests.
- Load test script: `scripts/debate-v2-load-test.mjs` (requires TEST Supabase env; no keys in repo).
- Playwright audit: `scripts/playwright-debate-v2-audit.mjs` (saves to `docs/audit/debate-v2/` when run with static server).

## Missing / deferred

See [`docs/QUESTIONS.md`](QUESTIONS.md) — frame folder path, optional topic seed file, full guest merge bottom sheet UI, numbered frames 1–20 audit screenshots pending automated capture run.

## Screenshots

Run `npm run audit:debate-v2` after `expo export` and a static server to populate `docs/audit/debate-v2/`.
