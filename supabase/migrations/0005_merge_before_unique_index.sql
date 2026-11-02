-- If 0004 failed with 23505 on groups_owner_name_active_uidx, run this once,
-- then re-run the remainder of 0004 starting at "Rate limit helper" (or re-run full fixed 0004).

create table if not exists public.maintenance_log (
  id bigint generated always as identity primary key,
  job_name text not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.maintenance_log enable row level security;

do $$
declare
  bucket record;
  keeper uuid;
  dup uuid;
  merged jsonb;
  i int;
begin
  for bucket in
    select g.owner_id, g.name_normalized, array_agg(g.id order by g.created_at asc) as ids
    from public.groups g
    where g.archived_at is null
    group by g.owner_id, g.name_normalized
    having count(*) > 1
  loop
    keeper := bucket.ids[1];
    merged := jsonb_build_object('keeper', keeper, 'archived', '[]'::jsonb);
    for i in 2..coalesce(array_length(bucket.ids, 1), 1)
    loop
      dup := bucket.ids[i];

      insert into public.group_members (group_id, user_id, role)
      select keeper, gm.user_id, gm.role
      from public.group_members gm
      where gm.group_id = dup
      on conflict do nothing;

      update public.game_sessions set group_id = keeper where group_id = dup;

      update public.groups
      set
        archived_at = now(),
        join_code = upper(substr(replace(dup::text, '-', ''), 1, 6))
      where id = dup;

      merged := jsonb_set(
        merged,
        '{archived}',
        coalesce(merged->'archived', '[]'::jsonb) || to_jsonb(dup::text)
      );
    end loop;

    insert into public.maintenance_log (job_name, summary)
    values (
      'merge_duplicate_groups',
      merged || jsonb_build_object('owner_id', bucket.owner_id, 'name_normalized', bucket.name_normalized)
    );
  end loop;
end $$;

insert into public.group_members (group_id, user_id, role)
select g.id, g.owner_id, 'leader'
from public.groups g
where g.archived_at is null
  and not exists (
    select 1 from public.group_members gm
    where gm.group_id = g.id and gm.user_id = g.owner_id
  );

create unique index if not exists groups_owner_name_active_uidx
  on public.groups (owner_id, name_normalized)
  where archived_at is null;
