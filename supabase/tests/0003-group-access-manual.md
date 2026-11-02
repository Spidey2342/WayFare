# Manual RLS check after `0003_fix_group_access.sql`

Run as three different authenticated users (leader L, member M, stranger S).

## Setup

1. Paste full contents of `supabase/migrations/0003_fix_group_access.sql` in Supabase SQL editor → Run.
2. Enable Realtime for `group_members` (Database → Replication) if not already.

## Leader (L)

- [ ] `select public.create_group('Test Crew', null, true);` returns uuid.
- [ ] `select public.get_group_lobby('<gid>');` returns JSON with non-empty `join_code` and at least one member (L as leader).
- [ ] App lobby shows the same code and member count.

## Member (M)

- [ ] `select public.join_group_by_code('<code>');` returns same `<gid>`.
- [ ] `select public.get_group_lobby('<gid>');` succeeds for M.
- [ ] Stranger S: `get_group_lobby('<gid>')` raises `not_a_member`.

## Direct SELECT (optional)

- [ ] L: `select join_code from groups where id = '<gid>';` returns code.
- [ ] L: `select * from group_members where group_id = '<gid>';` returns all members.
- [ ] S: same queries return zero rows (RLS).
