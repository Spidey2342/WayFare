# Polish backlog (skipped for speed)

Items deferred during BUILD FAST runs. Core behavior (RLS, solo/pass, practice round, tests) was not skipped.

## Debate

- Same-phone pass-and-play debate flow (shared device voting UX).
- Richer realtime error/reconnect states on `/debate/[sessionId]`.
- Leader-only UI affordances vs participant read-only when not leader.
- Debate results / recap screen after final round.

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
