# Duplicate / stale data prevention report

## Root cause

**Double submit on Create Group** with no server-side idempotency or per-owner name deduplication. Each tap called `create_group`, which always inserted a new row (join codes differed), producing duplicate names like two "Qavah" groups for one owner.

## SQL to run

Paste the full file into the Supabase SQL editor (after 0001–0003):

[`supabase/migrations/0004_prevent_duplicates.sql`](../supabase/migrations/0004_prevent_duplicates.sql)

## pg_cron / schedules

If **Database → Extensions → pg_cron** is enabled, uncomment and run the `cron.schedule` lines at the bottom of 0004.

Otherwise use **Supabase Dashboard → Integrations → Cron** (or scheduled Edge Function) to run:

- Daily: `select public.maintenance_archive_idle_groups();`
- Hourly: `select public.maintenance_close_stale_sessions();`
- Weekly: `select public.maintenance_purge_old_session_detail();` and `select public.maintenance_orphan_cleanup();`

## Cleanup on migrate

Duplicate groups (same `owner_id` + `name_normalized`) were merged: **oldest kept**, members and sessions moved, duplicates **archived** (`archived_at` set). Details in `maintenance_log` rows with `job_name = 'merge_duplicate_groups'`.

## Restore an archived group

Owner only, within **90 days** of archive:

```sql
select public.restore_group('<group_uuid>');
```

Or call `rpcRestoreGroup` from the app when UI is wired.

## Files changed

- `supabase/migrations/0004_prevent_duplicates.sql`
- `src/features/groups/api.ts`, `normalize.ts`, `groupErrors.ts`, `useSubmitRequestId.ts`
- `app/groups/create.tsx`, `app/groups/join.tsx`
- `app/auth/sign-up.tsx`, `app/auth/sign-in.tsx`
- Tests + manual checklist + Playwright spam script (optional E2E)
