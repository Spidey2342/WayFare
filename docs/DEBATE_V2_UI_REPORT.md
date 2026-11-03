# Debate V2 UI implementation report

Date: 2026-11-03 (P3 verification gate)

## Playwright frame audit (390×844)

Command: `npm run build:web` → `npx serve -s -l 4173 dist` → `npm run test:debate-v2-frames`

Evidence: `docs/audit/debate-v2/*.png`, `docs/audit/debate-v2/audit-report.json`

| Frame | Status | Route / notes |
| --- | --- | --- |
| D1 | **PASS** | `/dev/debate-v2/D1` |
| D2 | **PASS** | `/dev/debate-v2/D2` |
| D3 | **PASS** | `/dev/debate-v2/D3` |
| D4 | **PASS** | `/dev/debate-v2/D4` — includes **WAITING FOR OTHERS...** row |
| D5 | **PASS** | `/dev/debate-v2/D5` — soft timer row (sheet in live judge UI via gear) |
| D6 | **PASS** | `/dev/debate-v2/D6` |
| D7 | **PASS** | `/dev/debate-v2/D7` |
| D8 | **PASS** | `/dev/debate-v2/D8` |
| D9 | **PASS** | `/dev/debate-v2/D9` |
| D10 | **PASS** | `/dev/debate-v2/D10` — TEAMS Incomplete, Reconnecting chip |
| D3-12 | **PASS** | `/dev/debate-v2/D3-12` — **+N** overflow chip |
| D4-12 | **PASS** | `/dev/debate-v2/D4-12` |
| D5-12 | **PASS** | `/dev/debate-v2/D5-12` |
| S1 | **PASS** | `/debate/pass/setup` |
| S2 | **PASS** | `/dev/debate-v2/S2` |
| S3 | **PASS** | `/dev/debate-v2/S3` |
| O1 | **PASS** | `/debate/solo` |
| O2 | **PASS** | `/dev/debate-v2/O2` |
| O3 | **PASS** | `/dev/debate-v2/O3` |
| A1 | **PASS** | `/dev/auth-frame/A1` |
| A2 | **PASS** | `/dev/auth-frame/A2` |
| A3 | **PASS** | `/dev/debate-v2/A3` (merge sheet) |

## P3 edge cases (§11) — implementation

| Case | Status | Notes |
| --- | --- | --- |
| Leave sheet on back (online) | **PASS** | `LeaveGameSheet` on header back |
| Empty side banner (debating) | **PASS** | `DebateEmptySideBanner` for judge |
| Another device message | **PASS** | Realtime presence superseded banner |
| Presence chips | **PARTIAL** | Your chip + D10 participant list; not on every avatar in live D3 |
| Tab hidden clock pause | **PASS** | `useTabVisibleClock` + resync |
| Gear → soft timer sheet | **PASS** | Online + same-phone debate |
| 12-player +N chips | **PASS** | `DebateAvatarRow` maxVisible=5 |

## Auth AUTH_LOOK

| Screen | Status |
| --- | --- |
| welcome | **PASS** | `authScreen.bg` dark |
| reset-password | **PASS** | dark + gold CTA |
| sign-in / sign-up | **PASS** (prior pass) |

## T7b storage (section 14)

See `docs/DEBATE_REPORT.md` — S-1–S-7 not re-run in P3.
