# Debate P1 implementation report

Date: 2026-11-03

## SQL you must run (in order)

On your Supabase project (SQL editor or `supabase db push`), after **0001–0007**:

1. **`supabase/migrations/0008_debate_rules.sql`** — snapshot RPC, verdict/finalize flow, `next_round` / `end_session` / `claim_judge`, round-aware verdicts/results, spec error codes.
2. **`supabase/migrations/0009_seed_debate_topics.sql`** — 120 topics (idempotent).

If **0007** failed on `updated_at`, re-run the updated **0007** (adds `debate_topics.updated_at`) before **0008**.

## Client changes (P1-3 / P1-4)

- Online session renders from **`get_session_state`**; heartbeat **5s**; **`debateErrors`** maps section 10 codes.
- Results: server **`player_totals`**; **Another topic** → `next_round`; **Back to group** → judge `end_session`, others → group lobby.
- Topics: **`syncTopicsSince`** + **`hydrateDebateTopics`** on debate hub / solo; bundled JSON fallback.
- Signed-in: **`get_my_stats`** cache module; zustand persist strips server-owned fields via **`stripServerOwnedForPersist`**.

## Acceptance tests (O-1–O-9, S-1–S-4, S-7)

Run after **0008** and **0009** on a **TEST** project with `.env.test` (gitignored):

```env
SUPABASE_TEST_URL=
SUPABASE_TEST_ANON_KEY=
SUPABASE_TEST_SERVICE_ROLE_KEY=
```

```bash
node scripts/debate-v2-acceptance.mjs
node scripts/test-s7-audit.mjs
```

| Test | Status | Evidence |
| --- | --- | --- |
| O-1 | **FAIL** | Harness stub; needs 12 test users + full round script on TEST DB |
| O-2 | **FAIL** | Depends on O-1 harness |
| O-3 | **FAIL** | `claim_judge` RPC added in 0008; integration test not implemented |
| O-4 | **FAIL** | Join role matrix not scripted |
| O-5 | **FAIL** | Rejoin not scripted |
| O-6 | **FAIL** | Double `submit_verdict` not scripted |
| O-7 | **FAIL** | `not_judge` RPC test not scripted |
| O-8 | **FAIL** | `next_round` + single finalize not scripted |
| O-9 | **FAIL** | 21st player `session_full` not scripted |
| S-1 | **FAIL** | Reload XP E2E not implemented |
| S-2 | **FAIL** | Second device not implemented |
| S-3 | **FAIL** | Partial — `get_topics_since` + migration 0009; delta size log not automated |
| S-4 | **FAIL** | Cache-first timing not automated |
| S-7 | **PARTIAL** | Static audit `scripts/test-s7-audit.mjs` (partialize strip); full grep audit not PASS |

**Conclusion:** P1 **not** acceptance-complete per spec §13/§14.5 until TEST project runs pass and O/S rows are green.

---

## P2 — Solo & same phone (sections 7, 8, 14.4)

### SQL

Run **`0010_solo_pass_awards.sql`** after 0008/0009.

### Acceptance

| Test | Status | Evidence |
| --- | --- | --- |
| **U7** | **PASS** | `npm test` → `solo-daily-cap-test.ts` (5/day client mirror) |
| **S-5** | **PASS (unit)** / **PARTIAL (E2E)** | `outbox-test.ts` (client_id queue + no duplicate rows); signed-in pending clock + flush after reconnect not Playwright-automated |
| **S-6** | **PARTIAL** | `guest-merge-flow-test.ts`; full sign-up merge E2E still manual |
| **Solo offline Playwright** | **PASS** | `npm run build:web` + `npx serve -s -l 4173 dist` → `npm run test:debate-solo-offline` (2026-11-03) |
| **Pass offline Playwright** | **PASS** | Same server → `npm run test:debate-pass-offline` (2026-11-03) |

**Signed-in awards (§7 / §8 / §14.4):** Client calls `award_solo_debate` / `award_pass_debate` via `outbox.ts` after `0010_solo_pass_awards.sql` on TEST; verify capped XP + streak on a real account after migration apply.

**Conclusion:** P2 **guest/local** acceptance green (U7, offline Playwright). **S-5/S-6** full signed-in E2E still needs TEST Supabase + migration **0010**.

## Unit tests (local)

Existing Jest suite (`debate-v2-engine-test.ts`) still covers U1–U6 client logic. Run: `npm test`.
