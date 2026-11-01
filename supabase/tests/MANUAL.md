# Supabase RLS manual test plan

Use two accounts (A and B) in the app or Supabase Auth test users.

1. **Profile isolation** — As A, fetch B’s profile by id via REST/RPC. Expect empty or policy error unless A and B share a group.
2. **Group-only profile peek** — A and B join the same group. A can read B’s `display_name` and `avatar_key` only (not bio) per app queries; full row still policy-limited to own profile for updates.
3. **No direct member insert** — Attempt `supabase.from('group_members').insert(...)` from the client. Expect RLS violation.
4. **Join code** — Wrong code returns a friendly “That code didn’t work” message (RPC `invalid_code`).
5. **Leader RPCs** — As member, call `rotate_group_code` → forbidden. As leader, succeeds and code changes.
