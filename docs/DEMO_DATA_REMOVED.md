# Demo profile data removed

Rule 13: no fake identity in runtime code. This documents every demo/default identity that was found and what replaced it.

## Removed from runtime (`src/`, `app/`)

| Location | Was | Now |
|----------|-----|-----|
| `src/store/persist.ts` | Default profile name `Kofi`, `LEGACY_DEMO_NAMES`, seeded XP/badges | `EMPTY_PROFILE`, store version **8** clears legacy `profile.name` and server-owned progress on migrate |
| `src/store/index.ts` | Persisted demo profile for signed-in users | `partialize` omits name; `clearUserSessionState()` on sign-out |
| `app/(tabs)/profile.tsx` | `useAppStore` profile name / local progress | `useAccountPresentation()` — Supabase profile + `get_my_stats()`, skeleton/error/guest |
| `app/(tabs)/home.tsx` | Greeting from zustand `profile.name` | `useAccountPresentation()` — no fallback name |
| `app/auth/profile-setup.tsx` | Wrote zustand `profile.name` after save | Supabase only via `saveProfilePatch` + `refreshProfile()` |
| `app/debate/pass/setup.tsx` | Default players `Kofi King`, `Samuel D.`, `Ama Grace` | `Player 1`, `Player 2`, `Player 3` |
| `app/setup.tsx` | Default players `Kofi`, `Ama` | `Player 1`, `Player 2` |
| `app/community.tsx` | Sample authors `Kofi`, `Ama` | `Member B`, `Member A` |
| `app/(onboarding)/choose-mode.tsx` | Avatar stack demo names | `P1`, `P2`, `P3` |
| `src/features/debate/audit/DebateV2FramePreview.tsx` | Pass screen label `Ama Grace` | `Player 2` |
| `app/dev/kit.tsx`, `app/dev/lobby-preview.tsx` | Design sample names | Generic preview labels |

## Session hygiene (same task)

| Location | Change |
|----------|--------|
| `src/features/auth/userSession.ts` | Per-user cache keys (`v2`), `activateUserSession` / `clearActiveUserSession` |
| `src/features/debate/statsCache.ts` | Stats cache scoped by user id |
| `src/features/debate/outbox.ts` | Outbox scoped by user id |
| `src/features/auth/AuthContext.tsx` | `ensure_profile` on sign-in / app start; clear store + caches on sign-out |
| `src/features/auth/ensureProfileApi.ts` | RPC wrapper + cache write |
| `src/components/auth/AuthBackLink.tsx` | Visible back control on dark auth screens (Welcome back / sign-in) |

## Tests & scripts (fixtures only)

| Location | Change |
|----------|--------|
| `src/store/__tests__/migrate-test.ts` | Expect empty `profile.name` after v8 migrate |
| `scripts/playwright-*.mjs` | Guest store without demo name; `playwright-profile-session.mjs` for N2/N4/N5/N7 |
| Unit tests under `src/**/__tests__` | Neutral names (`Player 1`, `Leader`, etc.) |

## SQL to run in Supabase

After migrations **0007–0010**, run the full file:

**`supabase/migrations/0011_ensure_profile.sql`**

That defines `public.ensure_profile()` (SECURITY DEFINER, `auth.uid()`). The app calls it after every sign-in and on app start for signed-in users.

## Verification grep (acceptance N1)

From repo root, these names must not appear under `src/` or `app/`:

`Kofi`, `Samuel D.`, `Ama Grace`, `David K.`, `Sarah Jenkins`, `Caleb Thompson`, `Unity Youth`, `defaultProfile`, `demoUser`, `mockUser`, `initialProfile`, `sampleProfile`

(Bible/learn content such as “1 Samuel” or quiz option “Enoch” is not user demo data.)
