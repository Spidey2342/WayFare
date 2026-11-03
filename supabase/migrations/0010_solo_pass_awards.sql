-- Solo / same-phone signed-in awards: idempotent client_id, streak, profiles mirror.
-- Run after 0007 (user_stats). Safe if 0008 already defined debate_bump_streak (replaced here).

create or replace function public.debate_bump_streak(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_today date := (now() at time zone 'utc')::date;
  v_stats public.user_stats;
  v_next int;
begin
  insert into public.user_stats (user_id) values (p_user)
  on conflict (user_id) do nothing;
  select * into v_stats from public.user_stats where user_id = p_user for update;
  if v_stats.last_active_date = v_today then
    v_next := greatest(v_stats.streak_days, 1);
  elsif v_stats.last_active_date = v_today - 1 then
    v_next := v_stats.streak_days + 1;
  else
    v_next := 1;
  end if;
  update public.user_stats
  set streak_days = v_next, last_active_date = v_today, updated_at = now()
  where user_id = p_user;
end;
$$;

create table if not exists public.local_debate_awards (
  client_id uuid primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  xp_awarded int not null,
  kind text not null check (kind in ('solo', 'pass')),
  created_at timestamptz not null default now()
);

alter table public.local_debate_awards enable row level security;

create policy local_debate_awards_select_own
  on public.local_debate_awards for select to authenticated
  using (user_id = auth.uid());

create or replace function public.award_solo_debate(p_client_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_today date := (now() at time zone 'utc')::date;
  v_stats public.user_stats;
  v_existing public.local_debate_awards;
  v_xp int := 0;
  v_capped boolean := false;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_existing from public.local_debate_awards where client_id = p_client_id;
  if v_existing.client_id is not null then
    return jsonb_build_object(
      'xp', v_existing.xp_awarded,
      'capped', v_existing.xp_awarded = 0,
      'duplicate', true,
      'streak_days', (select streak_days from public.user_stats where user_id = v_uid)
    );
  end if;

  insert into public.user_stats (user_id) values (v_uid)
  on conflict (user_id) do nothing;
  select * into v_stats from public.user_stats where user_id = v_uid for update;

  if v_stats.solo_day is distinct from v_today then
    v_stats.solo_debates_today := 0;
    v_stats.solo_day := v_today;
  end if;

  if v_stats.solo_debates_today >= 5 then
    v_capped := true;
    v_xp := 0;
  else
    v_xp := 1;
    update public.user_stats
    set xp = xp + 1,
        solo_debates_today = solo_debates_today + 1,
        solo_day = v_today,
        updated_at = now()
    where user_id = v_uid;
    update public.profiles set xp = xp + 1 where id = v_uid;
    perform public.debate_bump_streak(v_uid);
  end if;

  insert into public.local_debate_awards (client_id, user_id, xp_awarded, kind)
  values (p_client_id, v_uid, v_xp, 'solo');

  select streak_days into v_stats.streak_days from public.user_stats where user_id = v_uid;

  return jsonb_build_object(
    'xp', v_xp,
    'capped', v_capped,
    'duplicate', false,
    'streak_days', v_stats.streak_days
  );
end;
$$;

create or replace function public.award_pass_debate(p_client_id uuid, p_xp int)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_existing public.local_debate_awards;
  v_xp int := greatest(0, least(coalesce(p_xp, 0), 50));
  v_streak int;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_existing from public.local_debate_awards where client_id = p_client_id;
  if v_existing.client_id is not null then
    select streak_days into v_streak from public.user_stats where user_id = v_uid;
    return jsonb_build_object(
      'xp', v_existing.xp_awarded,
      'duplicate', true,
      'streak_days', coalesce(v_streak, 0)
    );
  end if;

  insert into public.user_stats (user_id) values (v_uid)
  on conflict (user_id) do nothing;

  if v_xp > 0 then
    update public.user_stats
    set xp = xp + v_xp, updated_at = now()
    where user_id = v_uid;
    update public.profiles set xp = xp + v_xp where id = v_uid;
    perform public.debate_bump_streak(v_uid);
  end if;

  insert into public.local_debate_awards (client_id, user_id, xp_awarded, kind)
  values (p_client_id, v_uid, v_xp, 'pass');

  select streak_days into v_streak from public.user_stats where user_id = v_uid;

  return jsonb_build_object('xp', v_xp, 'duplicate', false, 'streak_days', coalesce(v_streak, 0));
end;
$$;

revoke all on function public.award_solo_debate(uuid) from public;
grant execute on function public.award_solo_debate(uuid) to authenticated;
revoke all on function public.award_pass_debate(uuid, int) from public;
grant execute on function public.award_pass_debate(uuid, int) to authenticated;
