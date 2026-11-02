-- Duplicate prevention, archival, rate limits, and housekeeping.
-- Run once in Supabase SQL editor after 0001, 0002 (if used), and 0003.

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.normalize_group_name(p_name text)
returns text
language sql
immutable
set search_path = ''
as $$
  select lower(trim(regexp_replace(trim(coalesce(p_name, '')), '\s+', ' ', 'g')));
$$;

create or replace function public.is_punctuation_only(p_text text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    length(regexp_replace(trim(coalesce(p_text, '')), '[^[:punct:]]', '', 'g')) > 0
      and length(regexp_replace(trim(coalesce(p_text, '')), '[[:punct:][:space:]]', '', 'g')) = 0,
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Groups: columns, constraints, indexes
-- ---------------------------------------------------------------------------
alter table public.groups
  add column if not exists name_normalized text,
  add column if not exists archived_at timestamptz,
  add column if not exists last_activity_at timestamptz not null default now();

update public.groups
set name_normalized = public.normalize_group_name(name)
where name_normalized is null;

alter table public.groups
  alter column name_normalized set not null;

alter table public.groups drop constraint if exists groups_name_check;
alter table public.groups
  add constraint groups_name_check check (
    char_length(trim(name)) between 3 and 40
    and not public.is_punctuation_only(name)
  );

alter table public.groups drop constraint if exists groups_description_check;
alter table public.groups
  add constraint groups_description_check check (
    description is null or char_length(trim(description)) <= 200
  );

create unique index if not exists groups_owner_name_active_uidx
  on public.groups (owner_id, name_normalized)
  where archived_at is null;

create or replace function public.groups_set_normalized()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.name := trim(regexp_replace(trim(coalesce(new.name, '')), '\s+', ' ', 'g'));
  new.name_normalized := public.normalize_group_name(new.name);
  if new.description is not null then
    new.description := nullif(trim(regexp_replace(trim(new.description), '\s+', ' ', 'g')), '');
  end if;
  new.last_activity_at := coalesce(new.last_activity_at, now());
  return new;
end;
$$;

drop trigger if exists groups_normalize_trg on public.groups;
create trigger groups_normalize_trg
  before insert or update of name, description on public.groups
  for each row execute function public.groups_set_normalized();

-- ---------------------------------------------------------------------------
-- Profiles: trim + length (not unique)
-- ---------------------------------------------------------------------------
alter table public.profiles drop constraint if exists profiles_display_name_len;
alter table public.profiles
  add constraint profiles_display_name_len check (
    display_name is null or char_length(trim(display_name)) between 1 and 40
  );

alter table public.profiles drop constraint if exists profiles_bio_len;
alter table public.profiles
  add constraint profiles_bio_len check (bio is null or char_length(bio) <= 200);

alter table public.profiles drop constraint if exists profiles_favorite_verse_len;
alter table public.profiles
  add constraint profiles_favorite_verse_len check (
    favorite_verse is null or char_length(favorite_verse) <= 200
  );

create or replace function public.profiles_normalize_text()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.display_name is not null then
    new.display_name := nullif(trim(regexp_replace(trim(new.display_name), '\s+', ' ', 'g')), '');
  end if;
  if new.bio is not null then
    new.bio := nullif(trim(regexp_replace(trim(new.bio), '\s+', ' ', 'g')), '');
  end if;
  if new.favorite_verse is not null then
    new.favorite_verse := nullif(trim(regexp_replace(trim(new.favorite_verse), '\s+', ' ', 'g')), '');
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_normalize_trg on public.profiles;
create trigger profiles_normalize_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_normalize_text();

-- ---------------------------------------------------------------------------
-- Support tables
-- ---------------------------------------------------------------------------
create table if not exists public.rate_limits (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index if not exists rate_limits_user_action_time_idx
  on public.rate_limits (user_id, action, created_at desc);

alter table public.rate_limits enable row level security;

create table if not exists public.group_create_requests (
  owner_id uuid not null references auth.users (id) on delete cascade,
  request_id uuid not null,
  group_id uuid not null references public.groups (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_id, request_id)
);

alter table public.group_create_requests enable row level security;

create table if not exists public.maintenance_log (
  id bigint generated always as identity primary key,
  job_name text not null,
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.maintenance_log enable row level security;

-- ---------------------------------------------------------------------------
-- One-time duplicate merge (archive extras, keep oldest)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Rate limit helper
-- ---------------------------------------------------------------------------
create or replace function public.rate_limit_count(
  p_user uuid,
  p_action text,
  p_window interval
)
returns int
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::int
  from public.rate_limits rl
  where rl.user_id = p_user
    and rl.action = p_action
    and rl.created_at > now() - p_window;
$$;

create or replace function public.rate_limit_hit(p_user uuid, p_action text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.rate_limits (user_id, action) values (p_user, p_action);
$$;

-- ---------------------------------------------------------------------------
-- create_group (json result + idempotency)
-- ---------------------------------------------------------------------------
drop function if exists public.create_group(text, text, boolean);

create or replace function public.create_group(
  name text,
  description text default null,
  is_private boolean default true,
  request_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gid uuid;
  norm text;
  desc_trim text;
  owned int;
  existing uuid;
  code text;
  attempts int := 0;
  already boolean := false;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  norm := public.normalize_group_name(name);
  desc_trim := nullif(trim(regexp_replace(trim(coalesce(description, '')), '\s+', ' ', 'g')), '');

  if char_length(norm) < 3 or char_length(norm) > 40 then
    raise exception 'invalid_name';
  end if;
  if public.is_punctuation_only(name) then
    raise exception 'invalid_name';
  end if;
  if desc_trim is not null and char_length(desc_trim) > 200 then
    raise exception 'invalid_description';
  end if;

  if request_id is not null then
    select gcr.group_id into gid
    from public.group_create_requests gcr
    where gcr.owner_id = uid and gcr.request_id = request_id;
    if gid is not null then
      return jsonb_build_object('group_id', gid, 'already_existed', false, 'idempotent', true);
    end if;
  end if;

  if public.rate_limit_count(uid, 'create_group', interval '1 hour') >= 3 then
    raise exception 'rate_limit_exceeded';
  end if;

  select count(*) into owned
  from public.groups g
  where g.owner_id = uid and g.archived_at is null;

  if owned >= 5 then
    raise exception 'group_limit_reached';
  end if;

  select g.id into existing
  from public.groups g
  where g.owner_id = uid
    and g.name_normalized = norm
    and g.archived_at is null
  limit 1;

  if existing is not null then
    if request_id is not null then
      insert into public.group_create_requests (owner_id, request_id, group_id)
      values (uid, request_id, existing)
      on conflict do nothing;
    end if;
    return jsonb_build_object('group_id', existing, 'already_existed', true);
  end if;

  loop
    attempts := attempts + 1;
    code := public.generate_join_code();
    begin
      insert into public.groups (name, description, is_private, join_code, owner_id, name_normalized)
      values (
        trim(regexp_replace(trim(name), '\s+', ' ', 'g')),
        desc_trim,
        coalesce(is_private, true),
        code,
        uid,
        norm
      )
      returning id into gid;
      exit;
    exception
      when unique_violation then
        if attempts >= 12 then
          raise exception 'code_generation_failed';
        end if;
        select g.id into existing
        from public.groups g
        where g.owner_id = uid and g.name_normalized = norm and g.archived_at is null;
        if existing is not null then
          gid := existing;
          already := true;
          exit;
        end if;
    end;
  end loop;

  insert into public.group_members (group_id, user_id, role)
  values (gid, uid, 'leader')
  on conflict do nothing;

  if request_id is not null then
    insert into public.group_create_requests (owner_id, request_id, group_id)
    values (uid, request_id, gid)
    on conflict do nothing;
  end if;

  perform public.rate_limit_hit(uid, 'create_group');

  return jsonb_build_object('group_id', gid, 'already_existed', already);
end;
$$;

grant execute on function public.create_group(text, text, boolean, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- join_group_by_code (archived groups + rate limit)
-- ---------------------------------------------------------------------------
create or replace function public.join_group_by_code(code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  normalized text;
  gid uuid;
  fails int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if public.rate_limit_count(uid, 'join_fail', interval '1 hour') >= 10 then
    raise exception 'join_rate_limited';
  end if;

  normalized := upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'));

  if char_length(normalized) <> 6 then
    perform public.rate_limit_hit(uid, 'join_fail');
    raise exception 'invalid_code';
  end if;

  select g.id into gid
  from public.groups g
  where g.join_code = normalized
    and g.archived_at is null;

  if gid is null then
    perform public.rate_limit_hit(uid, 'join_fail');
    raise exception 'invalid_code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (gid, uid, 'member')
  on conflict do nothing;

  update public.groups set last_activity_at = now() where id = gid;

  return gid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Restore archived group (owner, within 90 days)
-- ---------------------------------------------------------------------------
create or replace function public.restore_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  update public.groups g
  set archived_at = null, last_activity_at = now()
  where g.id = p_group_id
    and g.owner_id = uid
    and g.archived_at is not null
    and g.archived_at > now() - interval '90 days';
  if not found then
    raise exception 'cannot_restore';
  end if;
end;
$$;

grant execute on function public.restore_group(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- get_group_lobby: ignore archived
-- ---------------------------------------------------------------------------
create or replace function public.get_group_lobby(p_group_id uuid)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  payload json;
begin
  if uid is null then raise exception 'not_authenticated'; end if;
  if not public.is_group_member(p_group_id) then raise exception 'not_a_member'; end if;

  if exists (select 1 from public.groups g where g.id = p_group_id and g.archived_at is not null) then
    raise exception 'group_archived';
  end if;

  select json_build_object(
    'group', (
      select json_build_object(
        'id', g.id,
        'name', g.name,
        'description', g.description,
        'photo_url', g.photo_url,
        'is_private', g.is_private,
        'join_code', g.join_code,
        'owner_id', g.owner_id,
        'created_at', g.created_at
      )
      from public.groups g
      where g.id = p_group_id and g.archived_at is null
    ),
    'members', coalesce(
      (
        select json_agg(
          json_build_object(
            'user_id', gm.user_id,
            'role', gm.role,
            'joined_at', gm.joined_at,
            'display_name', coalesce(nullif(trim(p.display_name), ''), 'Member'),
            'avatar_key', p.avatar_key
          )
          order by gm.joined_at asc
        )
        from public.group_members gm
        left join public.profiles p on p.id = gm.user_id
        where gm.group_id = p_group_id
      ),
      '[]'::json
    )
  )
  into payload;

  if payload is null or (payload->'group') is null then
    raise exception 'group_not_found';
  end if;

  return payload;
end;
$$;

-- ---------------------------------------------------------------------------
-- game_sessions: heartbeat + one lobby per group
-- ---------------------------------------------------------------------------
alter table public.game_sessions
  add column if not exists last_heartbeat_at timestamptz not null default now();

create unique index if not exists game_sessions_one_lobby_per_group
  on public.game_sessions (group_id)
  where group_id is not null and status = 'active' and phase = 'lobby';

create or replace function public.create_debate_session(
  p_group_id uuid,
  p_topic_id text,
  p_config jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
  code text;
  profile_name text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not exists (select 1 from public.debate_topics t where t.id = p_topic_id and t.is_published) then
    raise exception 'Unknown topic';
  end if;
  if p_group_id is not null then
    if not exists (
      select 1 from public.groups g
      join public.group_members gm on gm.group_id = g.id and gm.user_id = uid
      where g.id = p_group_id and g.archived_at is null
    ) then
      raise exception 'Not a group member';
    end if;
    update public.game_sessions
    set status = 'cancelled', phase = 'results', finished_at = now()
    where group_id = p_group_id and status = 'active' and phase = 'lobby';
  end if;

  code := public.generate_join_code();
  insert into public.game_sessions (group_id, host_id, topic_id, room_code, expires_at, config, last_heartbeat_at)
  values (
    p_group_id,
    uid,
    p_topic_id,
    code,
    now() + interval '4 hours',
    coalesce(p_config, '{}'::jsonb) || jsonb_build_object('debateExtended', false),
    now()
  )
  returning id into sid;

  select coalesce(display_name, 'Player') into profile_name from public.profiles where id = uid;
  insert into public.session_players (session_id, user_id, display_name, avatar_key)
  select sid, uid, profile_name, avatar_key from public.profiles where id = uid
  on conflict do nothing;

  if p_group_id is not null then
    update public.groups set last_activity_at = now() where id = p_group_id;
  end if;

  return sid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Housekeeping (call from pg_cron or Supabase scheduled SQL)
-- ---------------------------------------------------------------------------
create or replace function public.maintenance_archive_idle_groups()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  archived_count int := 0;
begin
  update public.groups g
  set archived_at = now()
  where g.archived_at is null
    and (
      not exists (select 1 from public.group_members gm where gm.group_id = g.id and gm.user_id <> g.owner_id)
      and g.last_activity_at < now() - interval '30 days'
    );
  get diagnostics archived_count = row_count;

  update public.groups g
  set archived_at = now()
  where g.archived_at is null
    and not exists (select 1 from public.group_members gm where gm.group_id = g.id);

  insert into public.maintenance_log (job_name, summary)
  values ('archive_idle_groups', jsonb_build_object('archived', archived_count));

  return jsonb_build_object('archived', archived_count);
end;
$$;

create or replace function public.maintenance_close_stale_sessions()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  closed_lobby int := 0;
  finished_active int := 0;
begin
  delete from public.game_sessions
  where status = 'active' and phase = 'lobby' and created_at < now() - interval '4 hours';
  get diagnostics closed_lobby = row_count;

  update public.game_sessions gs
  set status = 'finished', phase = 'results', finished_at = now()
  where gs.status = 'active'
    and gs.phase <> 'lobby'
    and coalesce(gs.last_heartbeat_at, gs.created_at) < now() - interval '2 hours';
  get diagnostics finished_active = row_count;

  insert into public.maintenance_log (job_name, summary)
  values (
    'close_stale_sessions',
    jsonb_build_object('deleted_lobbies', closed_lobby, 'finished_active', finished_active)
  );

  return jsonb_build_object('deleted_lobbies', closed_lobby, 'finished_active', finished_active);
end;
$$;

create or replace function public.maintenance_purge_old_session_detail()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  votes_deleted int := 0;
  players_deleted int := 0;
begin
  delete from public.debate_votes dv
  using public.game_sessions gs
  where dv.session_id = gs.id
    and gs.status = 'finished'
    and gs.finished_at is not null
    and gs.finished_at < now() - interval '30 days';
  get diagnostics votes_deleted = row_count;

  delete from public.session_players sp
  using public.game_sessions gs
  where sp.session_id = gs.id
    and gs.status in ('finished', 'cancelled')
    and coalesce(gs.finished_at, gs.created_at) < now() - interval '30 days';
  get diagnostics players_deleted = row_count;

  insert into public.maintenance_log (job_name, summary)
  values (
    'purge_old_session_detail',
    jsonb_build_object('votes_deleted', votes_deleted, 'players_deleted', players_deleted)
  );

  return jsonb_build_object('votes_deleted', votes_deleted, 'players_deleted', players_deleted);
end;
$$;

create or replace function public.maintenance_orphan_cleanup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  members_removed int := 0;
  limits_removed int := 0;
begin
  delete from public.group_members gm
  using public.groups g
  where gm.group_id = g.id and g.archived_at is not null;
  get diagnostics members_removed = row_count;

  delete from public.rate_limits where created_at < now() - interval '7 days';
  get diagnostics limits_removed = row_count;

  insert into public.maintenance_log (job_name, summary)
  values (
    'orphan_cleanup',
    jsonb_build_object('members_removed', members_removed, 'rate_limits_removed', limits_removed)
  );

  return jsonb_build_object('members_removed', members_removed, 'rate_limits_removed', limits_removed);
end;
$$;

revoke all on function public.maintenance_archive_idle_groups() from public;
revoke all on function public.maintenance_close_stale_sessions() from public;
revoke all on function public.maintenance_purge_old_session_detail() from public;
revoke all on function public.maintenance_orphan_cleanup() from public;

-- pg_cron (enable extension in Supabase Dashboard if available):
-- select cron.schedule('wayfare-archive-groups', '0 3 * * *', $$select public.maintenance_archive_idle_groups();$$);
-- select cron.schedule('wayfare-close-sessions', '0 * * * *', $$select public.maintenance_close_stale_sessions();$$);
-- select cron.schedule('wayfare-purge-sessions', '0 4 * * 0', $$select public.maintenance_purge_old_session_detail();$$);
-- select cron.schedule('wayfare-orphan-cleanup', '0 5 * * 0', $$select public.maintenance_orphan_cleanup();$$);
-- Without pg_cron: use Supabase Dashboard → Database → Cron / Edge Functions on the same SQL.
