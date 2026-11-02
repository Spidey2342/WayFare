# Lobby empty join code / Members (0) — diagnosis

Date: 2026-11-02

## 1. Supabase env / project

- Client reads `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` from `.env` (see `src/services/supabase.ts`).
- `isSupabaseConfigured` is true when both are non-empty; `__DEV__` logs a one-line status via `logSupabaseDevStatus()` (no secrets).
- **Risk:** URL points at a project where `0001_init.sql` was never applied → RPC/table errors. **Risk:** keys from a different project than migrations → RLS tables missing or policies differ.
- User can create a group (security definer `create_group`) and land on lobby with a valid `id` even when **SELECT** on `groups` / `group_members` fails.

## 2. `create_group` RPC

- **Verified in `0001_init.sql`:** Inserts group, then `insert into group_members (group_id, user_id, role) values (gid, uid, 'leader')` in the same function before `return gid`.
- Returns **uuid only** (not join_code). Join code is on the row; lobby must read it via SELECT or `get_group_lobby`.

## 3. RLS (root cause)

- `group_members_select_member` uses `exists (select 1 from public.group_members gm where gm.group_id = group_members.group_id and gm.user_id = auth.uid())` — **self-referential** on `group_members`.
- `groups_select_member` also subqueries `group_members`, which triggers the same policy → **infinite recursion / empty reads**.
- Symptom: `fetchGroup` → `null`, `fetchGroupMembers` → `[]`, no thrown error in lobby (`reload` had no error handling).
- **Fix:** `SECURITY DEFINER` `is_group_member(group_id)` and policies that call it; optional `get_group_lobby(group_id)` for one-shot load.

## 4. Lobby query / param / errors

- Column name in DB is `join_code`; TypeScript `GroupRow.join_code` — correct.
- Route param `id` from `create_group` / `join_group_by_code` return value — correct.
- **Bug:** `reload()` did not catch errors; null group left `code` as `''`.
- **Bug:** `copyCode` called `setMessage('Code copied')` **before** copy and used `Share.share` instead of clipboard — "Code copied" with empty code.

## 5. Flow IDs

- Create → `router.replace(\`/groups/${id}/lobby\`)` — same id.
- Join → `router.replace(\`/groups/${groupId}/lobby\`)` — same id.
- Groups list → `/groups/${group.id}` — same id.

## 6. Groups list vs lobby

- List uses `fetchMyGroups()` → selects `group_members` first (same RLS bug) → often **empty list** even when user has a group; if user deep-links to lobby after create, list may still look empty while lobby shows broken empty state.

## Conclusion

**Primary root cause:** Recursive RLS on `group_members` (and dependent `groups` SELECT) prevents members and join code from loading after create/join.

**Secondary UI bugs:** No loading/error states; copy feedback lied; Share used instead of clipboard.
