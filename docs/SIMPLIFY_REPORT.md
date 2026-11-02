# Onboarding simplify + game rules + UI polish pass

## Removed (Part 1)
- Legacy onboarding routes (`/onboarding/goal`, `/onboarding/how-wayfare`, `/onboarding/practice`) and `onboarding_events` tracking
- `profiles.goal` usage in app code (DB columns unchanged)
- Home **Start here** checklist (`StartHereChecklist.tsx`)
- NavigationGuard tutorial gating (`tutorial_step`, local tutorial mirror, tutorial redirects)
- Profile **Replay the tour** action
- Checklist unit test
- `DebateHelpSheet` / old help copy wiring on debate and card game screens (replaced by `GameRulesSheet`)

## Built (Parts 2–5, partial)
- **App intro only:** `/welcome` → `/how-it-works` → `/choose-mode`, gated by `introSeen` (store v7)
- `src/data/gameRules.ts` + `GameRulesSheet` (Community Rules composition, 40ms row stagger)
- `seenRules[gameId]` for card game and debate (first open, `?`, hub **How to play**)
- Debate hub Learn-style tiles
- Debate UI components: prep panel, side reveal, vote grid, pass-the-phone gate, results view
- Pass/solo/online debate screens wired to new visuals + rules sheet
- `src/theme/motion.ts` shared duration/spring tokens (foundation for global LIT pass)

## Part 6 quality gate
- **Automated:** `npm run typecheck`, `npm run lint`, `npm test` (67 tests + emoji scan), `npm run build:web` — pass
- **Playwright:** `scripts/capture-final-audit.mjs` → `docs/audit/final/` (390×844, 360×640, 430×932) for intro, home, debate hub, solo setup
- **Side-by-side frame compare:** not run — reference PNGs in repo use long filenames (`Wayfare Onboarding Flow.png`), not `01`–`12` aliases from the spec
- **`docs/UI_QUALITY.md`:** draft checklist; most rows still **Needs work** until pixel compare + full-screen matrix

## Screenshot folders
- `docs/audit/final/` — Playwright captures (this pass)
- `docs/audit/undesigned/` — reserved; debate phase captures can be added when pass sessions are seeded in audit script

## Could not match frames (reason)
- Design assets are not named `02-onboarding.png` / `12-community.png` in `reference/design/`; verbatim string compare against frames was not automated
- Global LIT (0.97 press on every control, card flip shadow, confetti on all wins, timer teal→gold→coral) — partially applied (buttons, rules stagger, results bar spring); not exhaustive on every screen
- Empty/loading/error illustrations — existing components; not all routes have custom line-art empty states yet

## Tests added/updated
- Auth routing: intro redirect
- `game-rules-test.ts`: verbatim copy, `introSeen` migration, `seenRules` default
