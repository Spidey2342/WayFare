# Polish backlog (skipped for speed)

Items deferred during BUILD FAST runs. Core behavior (RLS, solo/pass, practice round, tests) was not skipped.

## Debate

- Automated host promotion after 20s disconnect (DB cron + toast).
- Supabase Presence for connected/away/offline chips.
- Full confetti + MVP card animation on results.
- Exact `08-games.png` asset when added to reference folder.
- Two-browser Playwright online test when CI Supabase secrets exist.

## Groups lobby

- Persist “ready” state to Supabase instead of local-only.
- Live member list polish when Realtime is off.

## Auth

- Full Google OAuth wiring when `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true` (UI stub exists).

## Design

- Full design-v2 PNG assets in repo (slices referenced in docs only).
- Animation polish on card flip and debate transitions.

## PWA / Stage 7+

- Service worker hardening, install prompt UX, offline deck cache (see foundation todos).
