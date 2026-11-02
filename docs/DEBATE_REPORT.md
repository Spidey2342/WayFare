# Debate game (Prompt 2)

## What shipped

- **Solo debate** — `/debate/solo`, local engine (`debateEngine.ts`), no auth required.
- **Online group debate** — migration `0002_debate_sessions.sql`, RPCs `start_group_debate`, `cast_debate_vote`, `advance_debate_round`, screen `/debate/[sessionId]` with Realtime on `game_sessions` / `game_session_players`.
- **Lobby entry** — Group lobby “Start debate” calls `rpcStartGroupDebate` and navigates to the session route.
- **Pass / solo card game** — `GameMode: 'solo'` in engine; setup + `/game/[sessionId]` with `?` help sheet.
- **Tests** — `debate-engine-test.ts`, solo `createSession` in `engine-test.ts`, auth routing for `/debate/*`.

## Run migration

Apply `supabase/migrations/0002_debate_sessions.sql` in the Supabase SQL editor (see `supabase/README.md`).

## Env

Same as foundation: `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Online debate requires a configured project and signed-in user.

## Known gaps

See `docs/POLISH_TODO.md`.
