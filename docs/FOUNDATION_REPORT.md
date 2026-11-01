# Wayfare foundation report (Supabase + accounts + groups + onboarding)

## What was built

### Stage 1 — Supabase
- `@supabase/supabase-js` with session persistence via existing `src/services/storage` adapter.
- `src/services/supabase.ts` (web URL detection, feature flag for Google OAuth).
- `supabase/migrations/0001_init.sql`: profiles, groups, group_members, onboarding_events, RLS, RPCs (`create_group`, `join_group_by_code`, `leave_group`, `rotate_group_code`, `remove_member`, `delete_my_account`, `server_now`).
- `supabase/README.md`, `supabase/tests/` checklist.
- `.env.example`, `.gitignore` updated for `.env`.

### Stage 2 — Auth (design-v2 accounts flow)
- Routes under `/auth/*`: welcome, sign-up, sign-in, reset-password, profile-setup, under-13.
- Age checkbox on sign-up (no DOB); under-13 gate without account creation.
- `AuthProvider`, navigation guard for protected routes (groups), return-to URL after login.
- Log out; delete account via `delete_my_account` RPC + confirmation modal.
- Google button hidden unless `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true`.

### Stage 3 — Guided onboarding
- `/onboarding/goal`, `/onboarding/how-wayfare`, `/onboarding/practice` (offline practice, First Step badge, `tutorial_completed`).
- Home **Start here** checklist with progress bar; swaps to Continue Journey when done/dismissed.
- Play tab **How do you want to play?** sheet (solo / same phone / online).
- First-time **How to play** sheet from Play flow; Help → Replay the tour on Profile.
- `onboarding_events` tracking; local + server `tutorial_step` resume.
- Legacy routes `/welcome`, `/how-it-works`, `/choose-mode` unchanged.

### Stage 4 — Groups (design-v2)
- `/groups` list + empty state, create, join (6-box code), profile, dark lobby shell.
- Supabase RPC + Realtime on `group_members`.
- Leader tools: rotate code, remove member; Start match placeholder.
- Sign-in sheet when guests pick online play.

### Tooling
- `scripts/slice-design-images.mjs` → `docs/audit/slices/` (chat-attached PNGs are narrow thumbnails; add full `reference/design-v2/` PNGs for richer slices).

## Tests and build (local)

| Check | Result |
|--------|--------|
| `npx tsc --noEmit` | Pass |
| `npx expo lint -- --max-warnings 0` | Pass (after fixes) |
| `npm test` | 49 passed + emoji scan |
| `npm run build:web` | Pass → `dist/` |

New unit tests: `src/features/auth/__tests__/routing-test.ts`, `src/features/onboarding/__tests__/checklist-test.ts`.

## Manual steps for you (Supabase)

1. Create a Supabase project.
2. Copy `.env.example` → `.env` and set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
3. Run `supabase/migrations/0001_init.sql` in the SQL editor (see `supabase/README.md`).
4. Add auth redirect URLs for localhost and your Vercel domain.
5. Enable Realtime replication for `group_members` if lobby updates are slow.
6. Optional: configure Google OAuth and set `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true`.
7. Run RLS checks from `supabase/tests/MANUAL.md` with two test users.

## Design gaps (reasons)

| Area | Gap |
|------|-----|
| Auth / groups visuals | Chat PNGs are low-width previews; full fidelity needs original `06-accounts.png` / `07-groups.png` in repo. |
| Lobby ready state | Ready is local per device until a shared presence column/channel is added. |
| Google sign-in | UI stub until provider + env flag are set. |
| Game header `?` | Help sheet wired from Play/setup path; in-game header button can be added in the gameplay pass. |
| Onboarding screenshots | Capture manually into `docs/audit/onboarding/` from web or device. |
