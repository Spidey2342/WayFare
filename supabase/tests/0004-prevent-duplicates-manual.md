# Manual SQL checks after `0004_prevent_duplicates.sql`

## Idempotency

```sql
select public.create_group('Unique Crew', null, true, '11111111-1111-1111-1111-111111111111'::uuid);
select public.create_group('Unique Crew', null, true, '11111111-1111-1111-1111-111111111111'::uuid);
-- Second call must return the same group_id with idempotent true (one row in groups).
```

## Same normalized name

```sql
select public.create_group('Qavah', null, true, gen_random_uuid());
select public.create_group('  qavah  ', null, true, gen_random_uuid());
-- Second returns already_existed true, same group_id.
```

## Owner limit

Create 5 distinct active groups, then:

```sql
select public.create_group('Sixth Group', null, true, gen_random_uuid());
-- Expect group_limit_reached.
```

## Archived hidden

Archive a group, then list via client / `select * from groups where archived_at is null` — archived id absent.

## Restore

```sql
select public.restore_group('<archived_group_id>');
```

## Cleanup (optional)

```sql
select public.maintenance_archive_idle_groups();
select public.maintenance_close_stale_sessions();
select public.maintenance_purge_old_session_detail();
select public.maintenance_orphan_cleanup();
select * from public.maintenance_log order by id desc limit 10;
```
