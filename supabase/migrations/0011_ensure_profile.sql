-- ensure_profile(): idempotent rows for signed-in user (profiles + user_stats).
-- Run after 0007 (user_stats).

create or replace function public.ensure_profile()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles;
  v_stats public.user_stats;
  v_badges jsonb;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  insert into public.profiles (id)
  values (v_uid)
  on conflict (id) do nothing;

  select * into v_profile from public.profiles where id = v_uid;

  insert into public.user_stats (user_id)
  values (v_uid)
  on conflict (user_id) do nothing;

  select * into v_stats from public.user_stats where user_id = v_uid;

  select coalesce(
    jsonb_agg(jsonb_build_object('badge_id', badge_id, 'earned_at', earned_at)),
    '[]'::jsonb
  )
  into v_badges
  from public.user_badges
  where user_id = v_uid;

  return jsonb_build_object(
    'profile', to_jsonb(v_profile),
    'stats', to_jsonb(v_stats),
    'badges', v_badges
  );
end;
$$;

revoke all on function public.ensure_profile() from public;
grant execute on function public.ensure_profile() to authenticated;
