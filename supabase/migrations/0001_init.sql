-- Wayfare foundation schema (run once in Supabase SQL editor or via CLI).
-- Requires: pgcrypto for gen_random_uuid() (enabled by default on Supabase).

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_key text,
  bio text,
  favorite_verse text,
  age_confirmed boolean not null default false,
  tutorial_completed boolean not null default false,
  tutorial_step int not null default 0,
  goal text,
  xp int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- Groups
-- ---------------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 1 and 80),
  description text,
  photo_url text,
  is_private boolean not null default true,
  join_code char(6) not null unique,
  owner_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index groups_owner_id_idx on public.groups (owner_id);

alter table public.groups enable row level security;

-- ---------------------------------------------------------------------------
-- Group members
-- ---------------------------------------------------------------------------
create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('leader', 'member')),
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index group_members_user_id_idx on public.group_members (user_id);

alter table public.group_members enable row level security;

-- ---------------------------------------------------------------------------
-- Onboarding analytics (no free text)
-- ---------------------------------------------------------------------------
create table public.onboarding_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  step text not null check (char_length(step) between 1 and 64),
  action text not null check (char_length(action) between 1 and 32),
  created_at timestamptz not null default now()
);

create index onboarding_events_user_id_idx on public.onboarding_events (user_id, created_at desc);

alter table public.onboarding_events enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.shares_group_with(viewer uuid, target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members a
    inner join public.group_members b on a.group_id = b.group_id
    where a.user_id = viewer
      and b.user_id = target
  );
$$;

revoke all on function public.shares_group_with(uuid, uuid) from public;
grant execute on function public.shares_group_with(uuid, uuid) to authenticated;

create or replace function public.generate_join_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  result text := '';
  i int;
  pick int;
begin
  for i in 1..6 loop
    pick := 1 + floor(random() * length(alphabet))::int;
    result := result || substr(alphabet, pick, 1);
  end loop;
  return result;
end;
$$;

revoke all on function public.generate_join_code() from public;

create or replace function public.server_now()
returns timestamptz
language sql
stable
security definer
set search_path = ''
as $$
  select now();
$$;

grant execute on function public.server_now() to authenticated, anon;

-- Auto profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Player')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy profiles_select_own_or_group
  on public.profiles
  for select
  to authenticated
  using (
    id = auth.uid()
    or public.shares_group_with(auth.uid(), id)
  );

create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

create policy groups_select_member
  on public.groups
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = groups.id
        and gm.user_id = auth.uid()
    )
  );

create policy group_members_select_member
  on public.group_members
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.group_members gm
      where gm.group_id = group_members.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy onboarding_events_select_own
  on public.onboarding_events
  for select
  to authenticated
  using (user_id = auth.uid());

create policy onboarding_events_insert_own
  on public.onboarding_events
  for insert
  to authenticated
  with check (user_id = auth.uid());

-- No direct insert/update/delete on groups or group_members (RPC only).

-- ---------------------------------------------------------------------------
-- RPC: create_group
-- ---------------------------------------------------------------------------
create or replace function public.create_group(
  name text,
  description text default null,
  is_private boolean default true
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gid uuid;
  code text;
  attempts int := 0;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if trim(name) is null or char_length(trim(name)) < 1 then
    raise exception 'invalid_name';
  end if;

  loop
    attempts := attempts + 1;
    code := public.generate_join_code();
    begin
      insert into public.groups (name, description, is_private, join_code, owner_id)
      values (trim(name), nullif(trim(description), ''), coalesce(is_private, true), code, uid)
      returning id into gid;
      exit;
    exception
      when unique_violation then
        if attempts >= 12 then
          raise exception 'code_generation_failed';
        end if;
    end;
  end loop;

  insert into public.group_members (group_id, user_id, role)
  values (gid, uid, 'leader');

  return gid;
end;
$$;

grant execute on function public.create_group(text, text, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: join_group_by_code
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
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  normalized := upper(regexp_replace(coalesce(code, ''), '[^A-Za-z0-9]', '', 'g'));

  if char_length(normalized) <> 6 then
    raise exception 'invalid_code';
  end if;

  select g.id into gid
  from public.groups g
  where g.join_code = normalized;

  if gid is null then
    raise exception 'invalid_code';
  end if;

  insert into public.group_members (group_id, user_id, role)
  values (gid, uid, 'member')
  on conflict do nothing;

  return gid;
end;
$$;

grant execute on function public.join_group_by_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: leave_group
-- ---------------------------------------------------------------------------
create or replace function public.leave_group(group_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  is_leader boolean;
  member_count int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  select exists (
    select 1 from public.group_members gm
    where gm.group_id = leave_group.group_id
      and gm.user_id = uid
      and gm.role = 'leader'
  ) into is_leader;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = leave_group.group_id and gm.user_id = uid
  ) then
    raise exception 'not_a_member';
  end if;

  delete from public.group_members
  where group_id = leave_group.group_id and user_id = uid;

  select count(*) into member_count
  from public.group_members gm
  where gm.group_id = leave_group.group_id;

  if member_count = 0 then
    delete from public.groups where id = leave_group.group_id;
  elsif is_leader then
    update public.group_members
    set role = 'leader'
    where group_id = leave_group.group_id
      and user_id = (
        select gm.user_id
        from public.group_members gm
        where gm.group_id = leave_group.group_id
        order by gm.joined_at asc
        limit 1
      );
    update public.groups set owner_id = (
      select gm.user_id
      from public.group_members gm
      where gm.group_id = leave_group.group_id and gm.role = 'leader'
      limit 1
    )
    where id = leave_group.group_id;
  end if;
end;
$$;

grant execute on function public.leave_group(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: rotate_group_code (leader only)
-- ---------------------------------------------------------------------------
create or replace function public.rotate_group_code(group_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  code text;
  attempts int := 0;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = rotate_group_code.group_id
      and gm.user_id = uid
      and gm.role = 'leader'
  ) then
    raise exception 'forbidden';
  end if;

  loop
    attempts := attempts + 1;
    code := public.generate_join_code();
    begin
      update public.groups
      set join_code = code
      where id = rotate_group_code.group_id;
      exit;
    exception
      when unique_violation then
        if attempts >= 12 then
          raise exception 'code_generation_failed';
        end if;
    end;
  end loop;

  return code;
end;
$$;

grant execute on function public.rotate_group_code(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: remove_member (leader only)
-- ---------------------------------------------------------------------------
create or replace function public.remove_member(group_id uuid, target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if target_user_id = uid then
    raise exception 'cannot_remove_self';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = remove_member.group_id
      and gm.user_id = uid
      and gm.role = 'leader'
  ) then
    raise exception 'forbidden';
  end if;

  delete from public.group_members
  where group_id = remove_member.group_id and user_id = target_user_id;
end;
$$;

grant execute on function public.remove_member(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: delete_my_account
-- ---------------------------------------------------------------------------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  delete from public.onboarding_events where user_id = uid;
  delete from public.group_members where user_id = uid;

  delete from public.groups g
  where g.owner_id = uid
    and not exists (
      select 1 from public.group_members gm
      where gm.group_id = g.id and gm.user_id <> uid
    );

  update public.groups
  set owner_id = (
    select gm.user_id
    from public.group_members gm
    where gm.group_id = groups.id and gm.role = 'leader'
    limit 1
  )
  where owner_id = uid;

  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
