# Dark surface text audit (2026-11-10)

Root cause: several debate pass screens used `typeScale.h2` (default `palette.midnight` text) on `palette.midnightDeep` / `debateUi.card` backgrounds.

Fix pattern: set `color: palette.white` (or `debateUi` light tokens) on headings and body copy over dark fills.

## Screens checked

| Screen | Path | Result |
| --- | --- | --- |
| Pass setup S1 | `app/debate/pass/setup.tsx` | **Fixed** — title uses `palette.white` |
| Pass session | `app/debate/pass/[sessionId].tsx` | OK — headings already white |
| Pass ready S3 | `src/features/debate/components/PassReadyScreen.tsx` | **Fixed** — "Ready?" heading |
| Debate hub | `app/debate/index.tsx` | OK — `debateUi` / white tokens |
| Solo | `app/debate/solo.tsx` | OK |
| Debate results | `src/features/debate/components/DebateResultsView.tsx` | OK — `bannerTitle` uses dynamic `textPrimary` |
| Groups lobby | `app/groups/[id]/lobby.tsx` | OK — error title white on dark |
| Profile header | `app/(tabs)/profile.tsx` | OK — `heroName` / rank on midnight band |
| Auth welcome/sign-in/sign-up | `app/auth/*` | OK — light `Screen` backgrounds |

## Tokens

- Body/heading on dark debate chrome: `palette.white`, `debateUi.muted`, `debateUi.gold`
- Added pass-player initials: `#1A1C2E` on fixed pastels (`passSetupPlayers.ts`)
