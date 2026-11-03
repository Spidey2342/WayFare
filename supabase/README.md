# Supabase setup (Wayfare)

## 1. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a project.
2. Copy **Project URL** and the **anon (public) key** from **Settings → API**.
3. In the repo root, copy `.env.example` to `.env` and set:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=false
```

Never commit `.env`. Never put the **service_role** key in the app or in git.

## 2. Run the migration

**Option A — SQL editor (recommended for first time)**

1. Open **SQL → New query**.
2. Paste the full contents of `supabase/migrations/0001_init.sql`.
3. Run once. Confirm tables `profiles`, `groups`, `group_members`, `onboarding_events` exist and RLS is enabled.
4. Run `migrations/0003_fix_group_access.sql` if group lobby shows empty join code or zero members (fixes RLS recursion + adds `get_group_lobby`).
5. Run `migrations/0004_prevent_duplicates.sql` to dedupe groups, add idempotent `create_group`, archival, and housekeeping. If index creation fails with duplicate `(owner_id, name_normalized)`, run `0005_merge_before_unique_index.sql` then re-run 0004.
6. Run `migrations/0002_debate.sql` for Debate tables and legacy RPCs (votes kept but unused).
7. Run `migrations/0006_debate_v2.sql` for Debate V2 (judge verdict, agree/disagree, topic history, guest merge RPC).
8. Run `migrations/0007_debate_data_and_pause.sql` for pause/resume, user stats tables, topic sync RPCs, solo award RPC.
9. Run `migrations/0008_debate_rules.sql` for `get_session_state`, verdict window, `finalize_round`, `next_round`, `end_session`, `claim_judge`, spec error codes.
10. Run `migrations/0009_seed_debate_topics.sql` for 120 idempotent debate topics (replaces manual seed file).
11. Run `migrations/0010_solo_pass_awards.sql` for idempotent solo/pass awards and streak on `user_stats`.
12. Run `migrations/0011_ensure_profile.sql` for `ensure_profile()` (creates missing `profiles` + `user_stats` rows after sign-in).

**Legacy (optional):** `reference/warefare-debate-topics/seed_debate_topics.sql` if you applied 0007 before 0009 existed.

**Exact SQL for Debate V2:** paste the full file [`migrations/0006_debate_v2.sql`](migrations/0006_debate_v2.sql) in the SQL editor after 0001–0005 and 0002.

### Email confirmation (optional)

Email confirmation is **off** by default for faster onboarding. To enable later: **Authentication → Providers → Email → Confirm email**, then adjust the app sign-up copy to mention inbox confirmation.

**Option B — Supabase CLI**

```bash
supabase link --project-ref YOUR_REF
supabase db push
```

## 3. Auth redirect URLs

In **Authentication → URL configuration**, add:

| Environment | Site URL / redirect |
|-------------|---------------------|
| Local web   | `http://localhost:8081` |
| Expo web    | `http://localhost:19006` (if you use it) |
| Production  | Your Vercel URL, e.g. `https://wayfare.vercel.app` |

Add the same URLs under **Redirect URLs** (wildcard `/**` is fine for Expo Router on web).

## 4. Email auth

Email/password is enabled by default. Confirm **Authentication → Providers → Email** is on.

## 5. Google OAuth (optional, feature-flagged)

The app shows **Continue with Google** only when `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true`.

1. Create OAuth credentials in Google Cloud Console (Web client).
2. In Supabase: **Authentication → Providers → Google**, paste Client ID and Secret.
3. Authorized redirect URI (from Supabase provider page):  
   `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
4. Set `EXPO_PUBLIC_GOOGLE_AUTH_ENABLED=true` in `.env` and redeploy.

## 6. Security checklist

Run the queries in `supabase/tests/rls-checklist.sql` as two test users (or read the manual checklist in that folder) to confirm:

- User A cannot read User B’s profile unless they share a group.
- Clients cannot `INSERT` into `group_members` directly.
- Non-leaders cannot call `rotate_group_code` or `remove_member`.

## 7. Realtime (groups lobby)

In **Database → Replication**, enable realtime for `group_members` (and optionally `groups`) if the lobby does not update live.
