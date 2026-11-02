# Debate game — delivery report

## Built

- **Three modes:** Solo (`/debate/solo`), same-phone (`/debate/pass/setup` → session), online (`/debate/join`, `/debate/[sessionId]`, group lobby start).
- **Phases:** Lobby, side reveal, prep, debate (For/Against UI), voting (secret pass on same-phone), results with points breakdown.
- **Engine:** `src/features/debate/` — `assignSides`, `tallyVotes`, `computeResults`, `scorePlayers`, `nextPhase`, `localSession` (mirrors SQL rules).
- **Supabase:** `supabase/migrations/0002_debate.sql` — topics (12 seeds), `game_sessions`, `session_players`, `debate_votes`, `debate_results`, RPCs, RLS.
- **Realtime:** Postgres changes on `game_sessions` and `session_players`; clock sync via `server_now()`.
- **Badges:** Silver Tongue (`debateMvp:1`), Fair Judge (`debateVotes:5`) replacing two prior badges (24 total unchanged).
- **Help:** First-run + `?` sheet (4 steps); kindness reminder on debate surface.
- **Audit assets:** `docs/audit/debate/` via `node scripts/slice-debate-audit.mjs` (reference PNGs not modified).
- **QA:** `docs/QA_CHECKLIST.md`; Playwright pass flow `scripts/playwright-debate-pass.mjs`.

## Test results

Run locally:

```bash
npm run typecheck
npm run lint
npm test
npm run build:web
node scripts/slice-debate-audit.mjs
# optional: npx serve dist -l 4173 && node scripts/playwright-debate-pass.mjs
```

Jest covers side assignment (2–8), self-vote rejection, ties, early end, scoring, pass voting flow.

## Assumptions

- Design file `reference/design-v2/08-games.png` is not in the repo; debate UI follows the Grid/confetti reference crop and PART B lobby styling.
- Host promotion after 20s disconnect and Presence chips are partially implemented (last_seen + reconnect UI); full host auto-promote cron is documented in `docs/POLISH_TODO.md`.
- Online side-reveal/prep use host **Continue** (`advance_phase`) rather than separate animated screens (same visual language).
- Reaction sticker tray is a placeholder button only.
- If you previously ran `0002_debate_sessions.sql`, drop those tables or run the new migration on a fresh project (migration drops old debate prototype objects).

## Design gaps

- No exact `08-games.png` slice in repo; cropped `debate-screen-reference.png` is an approximation.
- Confetti on results is minimal (text-first results on light theme).
- Solo voice note uses web MediaRecorder only when available.

## Manual Supabase steps

1. Run `0001_init.sql` if not already applied.
2. Run **`0002_debate.sql`** in SQL editor (or `supabase db push`).
3. Enable Realtime replication for `game_sessions` and `session_players`.
4. Set `.env` with `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
5. Smoke-test: create session from group lobby, join by code on a second account, complete one debate.
