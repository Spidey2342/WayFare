-- Fix group/member RLS recursion and add get_group_lobby RPC.
-- Run in Supabase SQL editor after 0001_init.sql (and 0002 if applied).

-- ---------------------------------------------------------------------------
-- Member check (bypasses RLS; no self-referential policies)
-- ---------------------------------------------------------------------------
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members gm
    where gm.group_id = p_group_id
      and gm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_group_member(uuid) from public;
grant execute on function public.is_group_member(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- One-time repair: owner must be leader in group_members
-- ---------------------------------------------------------------------------
insert into public.group_members (group_id, user_id, role)
select g.id, g.owner_id, 'leader'
from public.groups g
where not exists (
  select 1
  from public.group_members gm
  where gm.group_id = g.id
    and gm.user_id = g.owner_id
);

-- ---------------------------------------------------------------------------
-- Replace recursive SELECT policies
-- ---------------------------------------------------------------------------
drop policy if exists group_members_select_member on public.group_members;
create policy group_members_select_member
  on public.group_members
  for select
  to authenticated
  using (public.is_group_member(group_id));

drop policy if exists groups_select_member on public.groups;
create policy groups_select_member
  on public.groups
  for select
  to authenticated
  using (public.is_group_member(id));

-- ---------------------------------------------------------------------------
-- RPC: get_group_lobby — single payload for lobby UI
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
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if not public.is_group_member(p_group_id) then
    raise exception 'not_a_member';
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
      where g.id = p_group_id
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

revoke all on function public.get_group_lobby(uuid) from public;
grant execute on function public.get_group_lobby(uuid) to authenticated;
