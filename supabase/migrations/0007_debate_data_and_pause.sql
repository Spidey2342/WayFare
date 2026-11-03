-- Debate V2 data layer (section 14) + pause/resume + topic sync + session snapshot helpers.
-- Run after 0006_debate_v2.sql.

-- ---------------------------------------------------------------------------
-- Session clock fields (pause)
-- ---------------------------------------------------------------------------
alter table public.game_sessions
  add column if not exists round_no int not null default 1,
  add column if not exists state_version int not null default 0,
  add column if not exists paused_at timestamptz,
  add column if not exists total_paused_seconds int not null default 0,
  add column if not exists last_activity_at timestamptz not null default now(),
  add column if not exists expires_at timestamptz,
  add column if not exists max_players int not null default 20;

-- ---------------------------------------------------------------------------
-- User stats / badges (server-owned)
-- ---------------------------------------------------------------------------
create table if not exists public.user_stats (
  user_id uuid primary key references auth.users (id) on delete cascade,
  xp int not null default 0,
  streak_days int not null default 0,
  last_active_date date,
  solo_debates_today int not null default 0,
  solo_day date,
  debates_judged int not null default 0,
  debate_mvps int not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.user_stats enable row level security;

drop policy if exists user_stats_select_own on public.user_stats;
create policy user_stats_select_own
  on public.user_stats for select to authenticated
  using (user_id = auth.uid());

create table if not exists public.user_badges (
  user_id uuid not null references auth.users (id) on delete cascade,
  badge_id text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_id)
);

alter table public.user_badges enable row level security;

drop policy if exists user_badges_select_own on public.user_badges;
create policy user_badges_select_own
  on public.user_badges for select to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Topics updated_at (required by get_topics_since; spec §14.2)
-- ---------------------------------------------------------------------------
alter table public.debate_topics
  add column if not exists updated_at timestamptz;

update public.debate_topics
  set updated_at = created_at
  where updated_at is null;

alter table public.debate_topics
  alter column updated_at set default now(),
  alter column updated_at set not null;

create or replace function public.bump_debate_topic_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists debate_topics_updated_at on public.debate_topics;
create trigger debate_topics_updated_at
  before update on public.debate_topics
  for each row execute function public.bump_debate_topic_updated_at();

-- ---------------------------------------------------------------------------
-- Pause / resume debate (judge only)
-- ---------------------------------------------------------------------------
create or replace function public.pause_debate(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not public.debate_is_judge(p_session, v_uid) then raise exception 'not_judge'; end if;
  update public.game_sessions
  set paused_at = coalesce(paused_at, now()),
      state_version = state_version + 1,
      last_activity_at = now()
  where id = p_session and phase = 'debating' and paused_at is null;
end;
$$;

create or replace function public.resume_debate(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_paused timestamptz;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not public.debate_is_judge(p_session, v_uid) then raise exception 'not_judge'; end if;
  select paused_at into v_paused from public.game_sessions where id = p_session for update;
  if v_paused is null then return; end if;
  update public.game_sessions
  set total_paused_seconds = total_paused_seconds + greatest(0, extract(epoch from (now() - v_paused))::int),
      paused_at = null,
      state_version = state_version + 1,
      last_activity_at = now()
  where id = p_session and phase = 'debating';
end;
$$;

create or replace function public.cancel_verdict(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  if not public.debate_is_judge(p_session, v_uid) then raise exception 'not_judge'; end if;
  delete from public.debate_verdicts where session_id = p_session;
  update public.game_sessions
  set phase = 'debating',
      verdict_announced_at = null,
      state_version = state_version + 1,
      last_activity_at = now()
  where id = p_session and phase = 'verdict';
end;
$$;

-- ---------------------------------------------------------------------------
-- Topic sync
-- ---------------------------------------------------------------------------
create or replace function public.get_topics_since(p_since timestamptz default '1970-01-01'::timestamptz)
returns setof public.debate_topics
language sql
stable
security definer
set search_path = ''
as $$
  select *
  from public.debate_topics
  where updated_at > p_since and is_published = true
  order by updated_at asc;
$$;

-- ---------------------------------------------------------------------------
-- Stats read + solo award (minimal; finalize_round expansion in follow-up)
-- ---------------------------------------------------------------------------
create or replace function public.get_my_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_stats public.user_stats;
  v_badges jsonb;
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  insert into public.user_stats (user_id) values (v_uid)
  on conflict (user_id) do nothing;
  select * into v_stats from public.user_stats where user_id = v_uid;
  select coalesce(jsonb_agg(jsonb_build_object('badge_id', badge_id, 'earned_at', earned_at)), '[]'::jsonb)
  into v_badges
  from public.user_badges where user_id = v_uid;
  return jsonb_build_object('stats', to_jsonb(v_stats), 'badges', v_badges);
end;
$$;

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
begin
  if v_uid is null then raise exception 'not_authenticated'; end if;
  insert into public.user_stats (user_id) values (v_uid)
  on conflict (user_id) do nothing;
  select * into v_stats from public.user_stats where user_id = v_uid for update;
  if v_stats.solo_day is distinct from v_today then
    v_stats.solo_debates_today := 0;
    v_stats.solo_day := v_today;
  end if;
  if v_stats.solo_debates_today >= 5 then
    return jsonb_build_object('xp', 0, 'capped', true);
  end if;
  update public.user_stats
  set xp = xp + 1,
      solo_debates_today = solo_debates_today + 1,
      solo_day = v_today,
      updated_at = now()
  where user_id = v_uid;
  return jsonb_build_object('xp', 1, 'capped', false);
end;
$$;

revoke all on function public.pause_debate(uuid) from public;
grant execute on function public.pause_debate(uuid) to authenticated;
revoke all on function public.resume_debate(uuid) from public;
grant execute on function public.resume_debate(uuid) to authenticated;
revoke all on function public.cancel_verdict(uuid) from public;
grant execute on function public.cancel_verdict(uuid) to authenticated;
revoke all on function public.get_topics_since(timestamptz) from public;
grant execute on function public.get_topics_since(timestamptz) to authenticated, anon;
revoke all on function public.get_my_stats() from public;
grant execute on function public.get_my_stats() to authenticated;
revoke all on function public.award_solo_debate(uuid) from public;
grant execute on function public.award_solo_debate(uuid) to authenticated;

-- Seed 120 topics: run reference/warefare-debate-topics/seed_debate_topics.sql separately in SQL editor
-- (file is too large to duplicate here; documented in supabase/README.md).
