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
4. Paste and run `supabase/migrations/0002_debate.sql` for the full Debate game (topics, sessions, votes, results, RPCs).

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
