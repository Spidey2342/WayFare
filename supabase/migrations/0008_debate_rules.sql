-- Debate V2 rules: snapshot RPC, verdict window, finalize_round, next/end, claim_judge, spec error codes.
-- Run after 0007_debate_data_and_pause.sql.

-- Drop superseded signatures (0006/0007) before replacements.
drop function if exists public.submit_verdict(uuid, text, uuid);
drop function if exists public.change_verdict(uuid, text, uuid);
drop function if exists public.publish_verdict(uuid, text, uuid);
drop function if exists public.draw_topic(uuid);
drop function if exists public.shuffle_topic(uuid);
drop function if exists public.confirm_topic(uuid);
drop function if exists public.start_debate(uuid);
drop function if exists public.request_verdict(uuid);
drop function if exists public.cancel_verdict(uuid);
drop function if exists public.pause_debate(uuid);
drop function if exists public.resume_debate(uuid);
drop function if exists public.set_soft_timer(uuid, int);
drop function if exists public.move_player(uuid, uuid, text);
drop function if exists public.set_judge(uuid, uuid);
drop function if exists public.choose_side(uuid, text);

-- ---------------------------------------------------------------------------
-- Schema (round-aware verdicts + finished phase)
-- ---------------------------------------------------------------------------
alter table public.session_players
  add column if not exists left_at timestamptz;
alter table public.debate_verdicts
  add column if not exists round_no int not null default 1,
  add column if not exists xp_awarded_at timestamptz,
  add column if not exists points jsonb;

alter table public.debate_results
  add column if not exists round_no int not null default 1;

alter table public.debate_verdicts drop constraint if exists debate_verdicts_pkey;
alter table public.debate_verdicts
  add constraint debate_verdicts_pkey primary key (session_id, round_no);

alter table public.debate_results drop constraint if exists debate_results_pkey;
alter table public.debate_results
  add constraint debate_results_pkey primary key (session_id, round_no);

alter table public.game_sessions drop constraint if exists game_sessions_phase_check;
alter table public.game_sessions
  add constraint game_sessions_phase_check check (
    phase in ('lobby', 'topic', 'picking', 'debating', 'verdict', 'results', 'finished')
  );

-- ---------------------------------------------------------------------------
-- Spec error codes (section 10) — message is the code; client maps to copy.
-- ---------------------------------------------------------------------------
create or replace function public.debate_raise(p_code text)
returns void
language plpgsql
as $$
begin
  raise exception '%', p_code;
end;
$$;

create or replace function public.debate_require_auth()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then perform public.debate_raise('not_authenticated'); end if;
  return v_uid;
end;
$$;

create or replace function public.debate_require_member(p_session uuid, p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.debate_is_member(p_session, p_uid) then
    perform public.debate_raise('not_member');
  end if;
end;
$$;

create or replace function public.debate_require_judge(p_session uuid, p_uid uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.debate_is_judge(p_session, p_uid) then
    perform public.debate_raise('not_judge');
  end if;
end;
$$;

create or replace function public.debate_check_expected_phase(
  p_actual text,
  p_expected text
)
returns void
language plpgsql
as $$
begin
  if p_expected is not null and p_actual <> p_expected then
    perform public.debate_raise('wrong_phase');
  end if;
end;
$$;

create or replace function public.debate_assert_live(p_session uuid)
returns public.game_sessions
language plpgsql
security definer
set search_path = ''
as $$
declare
  gs public.game_sessions;
begin
  select * into gs from public.game_sessions where id = p_session for update;
  if gs.id is null then perform public.debate_raise('session_expired'); end if;
  if gs.status <> 'active' then perform public.debate_raise('session_expired'); end if;
  if gs.expires_at is not null and gs.expires_at < now() then
    perform public.debate_raise('session_expired');
  end if;
  return gs;
end;
$$;

-- ---------------------------------------------------------------------------
-- Points (section 4) — display totals; XP applied only in finalize_round.
-- ---------------------------------------------------------------------------
create or replace function public.debate_compute_player_totals(
  p_session uuid,
  p_round_no int
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v record;
  v_side text;
  v_mvp uuid;
  v_totals jsonb := '{}'::jsonb;
  v_xp int;
  v_agree int;
  v_disagree int;
begin
  select winning_side, mvp_user_id into v_side, v_mvp
  from public.debate_verdicts
  where session_id = p_session and round_no = p_round_no;
  if v_side is null then return v_totals; end if;

  select c.agree, c.disagree into v_agree, v_disagree
  from public.debate_side_counts(p_session) as c;

  for v in
    select sp.user_id, sp.side, sp.role
    from public.session_players sp
    where sp.session_id = p_session and sp.left_at is null
  loop
    v_xp := 0;
    if v.role = 'judge' then
      v_xp := 1;
    elsif v.role = 'debater' then
      v_xp := 1;
      if v_side = 'draw' then
        v_xp := v_xp + 2;
      elsif v.side = v_side then
        v_xp := v_xp + 3;
      end if;
      if v_mvp is not null and v_mvp = v.user_id then
        v_xp := v_xp + 2;
      end if;
    end if;
    v_totals := v_totals || jsonb_build_object(v.user_id::text, v_xp);
  end loop;

  insert into public.debate_results (
    session_id, round_no, winning_side, tie, side_totals, player_totals, mvp_ids
  )
  values (
    p_session,
    p_round_no,
    case when v_side = 'draw' then null else v_side end,
    v_side = 'draw',
    jsonb_build_object('agree', coalesce(v_agree, 0), 'disagree', coalesce(v_disagree, 0)),
    v_totals,
    case when v_mvp is null then '{}'::uuid[] else array[v_mvp] end
  )
  on conflict (session_id, round_no) do update set
    winning_side = excluded.winning_side,
    tie = excluded.tie,
    side_totals = excluded.side_totals,
    player_totals = excluded.player_totals,
    mvp_ids = excluded.mvp_ids;

  update public.debate_verdicts
  set points = v_totals
  where session_id = p_session and round_no = p_round_no;

  return v_totals;
end;
$$;

create or replace function public.award_badge_if_earned(p_user uuid, p_badge_id text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_badges (user_id, badge_id)
  values (p_user, p_badge_id)
  on conflict (user_id, badge_id) do nothing;
end;
$$;

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

create or replace function public.finalize_round(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  gs public.game_sessions;
  v record;
  rec record;
  v_totals jsonb;
  v_xp int;
  v_side text;
  v_mvp uuid;
  v_judge uuid;
begin
  select * into gs from public.game_sessions where id = p_session for update;
  if gs.id is null then return; end if;

  select * into v
  from public.debate_verdicts
  where session_id = p_session and round_no = gs.round_no;
  if v.session_id is null or v.xp_awarded_at is not null then return; end if;

  v_side := v.winning_side;
  v_mvp := v.mvp_user_id;
  v_judge := v.decided_by;

  v_totals := public.debate_compute_player_totals(p_session, gs.round_no);

  for rec in
    select sp.user_id, sp.role
    from public.session_players sp
    where sp.session_id = p_session and sp.left_at is null
  loop
    v_xp := coalesce((v_totals ->> rec.user_id::text)::int, 0);
    if v_xp <= 0 then continue; end if;

    insert into public.user_stats (user_id) values (rec.user_id)
    on conflict (user_id) do nothing;

    update public.user_stats
    set xp = xp + v_xp, updated_at = now()
    where user_id = rec.user_id;

    update public.profiles set xp = xp + v_xp where id = rec.user_id;

    perform public.debate_bump_streak(rec.user_id);
  end loop;

  if v_judge is not null then
    insert into public.user_stats (user_id) values (v_judge)
    on conflict (user_id) do nothing;
    update public.user_stats
    set debates_judged = debates_judged + 1, updated_at = now()
    where user_id = v_judge;
    update public.profiles set debates_judged = debates_judged + 1 where id = v_judge;
    if (select debates_judged from public.user_stats where user_id = v_judge) >= 5 then
      perform public.award_badge_if_earned(v_judge, 'fair-judge');
    end if;
  end if;

  if v_mvp is not null then
    insert into public.user_stats (user_id) values (v_mvp)
    on conflict (user_id) do nothing;
    update public.user_stats
    set debate_mvps = debate_mvps + 1, updated_at = now()
    where user_id = v_mvp;
    perform public.award_badge_if_earned(v_mvp, 'silver-tongue');
  end if;

  update public.debate_verdicts
  set xp_awarded_at = now()
  where session_id = p_session and round_no = gs.round_no;

  update public.game_sessions set xp_awarded = true where id = p_session;
end;
$$;

create or replace function public.debate_maybe_auto_finalize(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  gs public.game_sessions;
begin
  select * into gs from public.game_sessions where id = p_session;
  if gs.phase <> 'results' or gs.verdict_announced_at is null then return; end if;
  if gs.verdict_announced_at + interval '30 seconds' > now() then return; end if;
  perform public.finalize_round(p_session);
end;
$$;

-- ---------------------------------------------------------------------------
-- Judge promotion / claim (old judge -> spectator)
-- ---------------------------------------------------------------------------
create or replace function public.debate_promote_judge(p_session uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  gs public.game_sessions;
  judge uuid;
  replacement uuid;
begin
  select * into gs from public.game_sessions where id = p_session for update;
  if gs.status <> 'active' then return gs.judge_id; end if;
  judge := gs.judge_id;
  if judge is null then return null; end if;
  if exists (
    select 1 from public.session_players sp
    where sp.session_id = p_session and sp.user_id = judge
      and sp.last_seen_at > now() - interval '20 seconds'
  ) then
    return judge;
  end if;
  if gs.group_id is not null then
    replacement := public.debate_group_leader(gs.group_id);
    if replacement is not null and replacement <> judge then
      update public.game_sessions
      set judge_id = replacement, state_version = state_version + 1
      where id = p_session;
      update public.session_players set role = 'judge', side = null
      where session_id = p_session and user_id = replacement;
      update public.session_players set role = 'spectator', side = null
      where session_id = p_session and user_id = judge;
      return replacement;
    end if;
  end if;
  select sp.user_id into replacement
  from public.session_players sp
  where sp.session_id = p_session and sp.user_id <> judge
  order by sp.connected_at asc
  limit 1;
  if replacement is not null then
    update public.game_sessions
    set judge_id = replacement, state_version = state_version + 1
    where id = p_session;
    update public.session_players set role = 'judge', side = null
    where session_id = p_session and user_id = replacement;
    update public.session_players set role = 'spectator', side = null
    where session_id = p_session and user_id = judge;
  end if;
  return replacement;
end;
$$;

create or replace function public.claim_judge(p_session uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  judge uuid;
  gs public.game_sessions;
begin
  perform public.debate_require_member(p_session, v_uid);
  select * into gs from public.game_sessions where id = p_session;
  judge := gs.judge_id;
  if judge is null then return null; end if;
  if exists (
    select 1 from public.session_players sp
    where sp.session_id = p_session and sp.user_id = judge
      and sp.last_seen_at > now() - interval '20 seconds'
  ) then
    return judge;
  end if;
  return public.debate_promote_judge(p_session);
end;
$$;

-- ---------------------------------------------------------------------------
-- Snapshot
-- ---------------------------------------------------------------------------
create or replace function public.get_session_state(p_session uuid)
returns jsonb
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
  v_topic jsonb;
  v_verdict jsonb;
  v_results jsonb;
  v_parts jsonb;
  v_judge uuid;
begin
  perform public.debate_require_member(p_session, v_uid);
  perform public.debate_maybe_auto_finalize(p_session);

  select * into gs from public.game_sessions where id = p_session;
  v_judge := gs.judge_id;

  if gs.topic_id is not null then
    select jsonb_build_object(
      'id', t.id,
      'text', t.text,
      'category', t.category,
      'difficulty', t.difficulty
    ) into v_topic
    from public.debate_topics t where t.id = gs.topic_id;
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'user_id', sp.user_id,
    'display_name', sp.display_name,
    'avatar_key', sp.avatar_key,
    'role', sp.role,
    'side', sp.side,
    'presence', case
      when sp.last_seen_at > now() - interval '20 seconds' then 'online'
      else 'away'
    end,
    'last_seen_at', sp.last_seen_at,
    'connected_at', sp.connected_at,
    'left_at', sp.left_at
  ) order by sp.connected_at), '[]'::jsonb)
  into v_parts
  from public.session_players sp
  where sp.session_id = p_session;

  select jsonb_build_object(
    'winning_side', dv.winning_side,
    'mvp_user_id', dv.mvp_user_id,
    'decided_by', dv.decided_by,
    'decided_at', dv.decided_at,
    'changed_at', dv.changed_at,
    'verdict_announced_at', gs.verdict_announced_at,
    'xp_awarded_at', dv.xp_awarded_at,
    'points', dv.points,
    'round_no', dv.round_no
  ) into v_verdict
  from public.debate_verdicts dv
  where dv.session_id = p_session and dv.round_no = gs.round_no;

  select jsonb_build_object(
    'winning_side', dr.winning_side,
    'tie', dr.tie,
    'side_totals', dr.side_totals,
    'player_totals', dr.player_totals,
    'mvp_ids', dr.mvp_ids,
    'round_no', dr.round_no
  ) into v_results
  from public.debate_results dr
  where dr.session_id = p_session and dr.round_no = gs.round_no;

  return jsonb_build_object(
    'session', jsonb_build_object(
      'id', gs.id,
      'group_id', gs.group_id,
      'status', gs.status,
      'phase', gs.phase,
      'round_no', gs.round_no,
      'state_version', gs.state_version,
      'topic_id', gs.topic_id,
      'judge_id', gs.judge_id,
      'soft_timer_minutes', gs.soft_timer_minutes,
      'debate_started_at', gs.debate_started_at,
      'paused_at', gs.paused_at,
      'total_paused_seconds', gs.total_paused_seconds,
      'verdict_announced_at', gs.verdict_announced_at,
      'room_code', gs.room_code,
      'xp_awarded', gs.xp_awarded
    ),
    'topic', v_topic,
    'round_no', gs.round_no,
    'phase', gs.phase,
    'judge_id', v_judge,
    'participants', v_parts,
    'soft_timer_minutes', gs.soft_timer_minutes,
    'pause', jsonb_build_object(
      'paused_at', gs.paused_at,
      'total_paused_seconds', gs.total_paused_seconds
    ),
    'verdict', v_verdict,
    'results', v_results,
    'server_now', to_jsonb(now())
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Verdict flow
-- ---------------------------------------------------------------------------
create or replace function public.submit_verdict(
  p_session uuid,
  p_winning_side text,
  p_mvp_user_id uuid default null,
  p_expected_phase text default 'verdict'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  if p_winning_side not in ('agree', 'disagree', 'draw') then
    perform public.debate_raise('wrong_phase');
  end if;
  if p_mvp_user_id is not null and not exists (
    select 1 from public.session_players sp
    where sp.session_id = p_session and sp.user_id = p_mvp_user_id and sp.role = 'debater'
  ) then
    perform public.debate_raise('wrong_phase');
  end if;

  insert into public.debate_verdicts (
    session_id, round_no, winning_side, mvp_user_id, decided_by
  )
  values (p_session, gs.round_no, p_winning_side, p_mvp_user_id, v_uid)
  on conflict (session_id, round_no) do update set
    winning_side = excluded.winning_side,
    mvp_user_id = excluded.mvp_user_id,
    decided_by = excluded.decided_by,
    decided_at = now(),
    changed_at = null,
    xp_awarded_at = null,
    points = null;

  update public.game_sessions
  set phase = 'results',
      verdict_announced_at = now(),
      state_version = state_version + 1,
      last_activity_at = now(),
      xp_awarded = false
  where id = p_session;

  perform public.debate_compute_player_totals(p_session, gs.round_no);
end;
$$;

create or replace function public.change_verdict(
  p_session uuid,
  p_winning_side text,
  p_mvp_user_id uuid default null,
  p_expected_phase text default 'results'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  if gs.verdict_announced_at is null
    or gs.verdict_announced_at + interval '30 seconds' <= now() then
    perform public.debate_raise('wrong_phase');
  end if;
  if p_mvp_user_id is not null and not exists (
    select 1 from public.session_players sp
    where sp.session_id = p_session and sp.user_id = p_mvp_user_id and sp.role = 'debater'
  ) then
    perform public.debate_raise('wrong_phase');
  end if;

  update public.debate_verdicts
  set winning_side = p_winning_side,
      mvp_user_id = p_mvp_user_id,
      changed_at = now(),
      xp_awarded_at = null
  where session_id = p_session and round_no = gs.round_no;

  perform public.debate_compute_player_totals(p_session, gs.round_no);

  update public.game_sessions
  set state_version = state_version + 1, last_activity_at = now(), xp_awarded = false
  where id = p_session;
end;
$$;

create or replace function public.publish_verdict(
  p_session uuid,
  p_winning_side text,
  p_mvp_user_id uuid default null,
  p_expected_phase text default 'verdict'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.submit_verdict(p_session, p_winning_side, p_mvp_user_id, p_expected_phase);
end;
$$;

create or replace function public.next_round(
  p_session uuid,
  p_expected_phase text default 'results'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  perform public.finalize_round(p_session);

  update public.session_players
  set side = null
  where session_id = p_session and role = 'debater';

  update public.game_sessions
  set round_no = round_no + 1,
      phase = 'topic',
      debate_started_at = null,
      paused_at = null,
      total_paused_seconds = 0,
      soft_timer_minutes = null,
      verdict_announced_at = null,
      state_version = state_version + 1,
      last_activity_at = now(),
      xp_awarded = false
  where id = p_session;
end;
$$;

create or replace function public.end_session(
  p_session uuid,
  p_expected_phase text default 'results'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  perform public.finalize_round(p_session);

  update public.game_sessions
  set phase = 'finished',
      status = 'finished',
      finished_at = now(),
      state_version = state_version + 1,
      last_activity_at = now()
  where id = p_session;
end;
$$;

-- Legacy name: finalize_debate -> finalize_round only (no phase change)
create or replace function public.finalize_debate(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.finalize_round(p_session);
end;
$$;

-- ---------------------------------------------------------------------------
-- Heartbeat (5s client) + auto-finalize
-- ---------------------------------------------------------------------------
create or replace function public.debate_touch_session(p_session uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  new_judge uuid;
begin
  perform public.debate_require_member(p_session, v_uid);
  update public.session_players set last_seen_at = now()
  where session_id = p_session and user_id = v_uid;
  update public.game_sessions set last_heartbeat_at = now(), last_activity_at = now()
  where id = p_session;
  perform public.debate_maybe_auto_finalize(p_session);
  new_judge := public.debate_promote_judge(p_session);
  return new_judge;
end;
$$;

-- ---------------------------------------------------------------------------
-- Judge RPCs (+ expected_phase, spec errors)
-- ---------------------------------------------------------------------------
create or replace function public.draw_topic(
  p_session uuid,
  p_expected_phase text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
  picked text;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  if p_expected_phase is not null then
    perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  elsif gs.phase not in ('lobby', 'topic') then
    perform public.debate_raise('wrong_phase');
  end if;

  if gs.group_id is not null then
    picked := public.debate_pick_topic_for_group(gs.group_id);
  else
    picked := public.debate_pick_topic_global();
  end if;
  if picked is null then perform public.debate_raise('wrong_phase'); end if;

  update public.game_sessions
  set topic_id = picked, phase = 'topic', state_version = state_version + 1
  where id = p_session;
  if gs.group_id is not null then
    insert into public.group_topic_history (group_id, topic_id) values (gs.group_id, picked)
    on conflict do nothing;
  end if;
  return picked;
end;
$$;

create or replace function public.shuffle_topic(p_session uuid, p_expected_phase text default 'topic')
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.draw_topic(p_session, p_expected_phase);
end;
$$;

create or replace function public.confirm_topic(p_session uuid, p_expected_phase text default 'topic')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  if gs.topic_id is null then perform public.debate_raise('wrong_phase'); end if;
  update public.game_sessions
  set phase = 'picking', state_version = state_version + 1
  where id = p_session;
end;
$$;

create or replace function public.start_debate(
  p_session uuid,
  p_expected_phase text default 'picking'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
  c record;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  select * into c from public.debate_side_counts(p_session);
  if coalesce(c.agree, 0) < 1 or coalesce(c.disagree, 0) < 1 then
    perform public.debate_raise('side_required');
  end if;
  update public.game_sessions
  set phase = 'debating',
      debate_started_at = now(),
      phase_ends_at = null,
      state_version = state_version + 1
  where id = p_session;
end;
$$;

create or replace function public.request_verdict(
  p_session uuid,
  p_expected_phase text default 'debating'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  update public.game_sessions
  set phase = 'verdict', state_version = state_version + 1
  where id = p_session;
end;
$$;

create or replace function public.cancel_verdict(
  p_session uuid,
  p_expected_phase text default 'verdict'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  delete from public.debate_verdicts
  where session_id = p_session and round_no = gs.round_no;
  update public.game_sessions
  set phase = 'debating',
      verdict_announced_at = null,
      state_version = state_version + 1
  where id = p_session and phase = 'verdict';
end;
$$;

create or replace function public.pause_debate(
  p_session uuid,
  p_expected_phase text default 'debating'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  update public.game_sessions
  set paused_at = coalesce(paused_at, now()),
      state_version = state_version + 1
  where id = p_session and paused_at is null;
end;
$$;

create or replace function public.resume_debate(
  p_session uuid,
  p_expected_phase text default 'debating'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
  v_paused timestamptz;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  select paused_at into v_paused from public.game_sessions where id = p_session for update;
  if v_paused is null then return; end if;
  update public.game_sessions
  set total_paused_seconds = total_paused_seconds
      + greatest(0, extract(epoch from (now() - v_paused))::int),
      paused_at = null,
      state_version = state_version + 1
  where id = p_session;
end;
$$;

create or replace function public.set_soft_timer(
  p_session uuid,
  p_minutes int,
  p_expected_phase text default 'debating'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  if p_minutes is not null and p_minutes not in (3, 5, 10) then
    perform public.debate_raise('wrong_phase');
  end if;
  update public.game_sessions
  set soft_timer_minutes = p_minutes, state_version = state_version + 1
  where id = p_session;
end;
$$;

create or replace function public.move_player(
  p_session uuid,
  p_user uuid,
  p_side text,
  p_expected_phase text default 'picking'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  if p_side not in ('agree', 'disagree') then perform public.debate_raise('wrong_phase'); end if;
  update public.session_players
  set side = p_side, role = 'debater', last_seen_at = now()
  where session_id = p_session and user_id = p_user and role <> 'spectator';
  update public.game_sessions set state_version = state_version + 1 where id = p_session;
end;
$$;

create or replace function public.set_judge(
  p_session uuid,
  p_user uuid,
  p_expected_phase text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
  v_old uuid;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_require_judge(p_session, v_uid);
  if p_expected_phase is not null then
    perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  end if;
  if not public.debate_is_member(p_session, p_user) then
    perform public.debate_raise('not_member');
  end if;
  v_old := gs.judge_id;
  update public.session_players set role = 'spectator', side = null
  where session_id = p_session and user_id = v_old;
  update public.game_sessions set judge_id = p_user, state_version = state_version + 1
  where id = p_session;
  update public.session_players set role = 'judge', side = null
  where session_id = p_session and user_id = p_user;
end;
$$;

create or replace function public.choose_side(
  p_session uuid,
  p_side text,
  p_expected_phase text default 'picking'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  perform public.debate_check_expected_phase(gs.phase, p_expected_phase);
  if p_side not in ('agree', 'disagree') then perform public.debate_raise('wrong_phase'); end if;
  if public.debate_is_judge(p_session, v_uid) then perform public.debate_raise('not_judge'); end if;
  perform public.debate_require_member(p_session, v_uid);
  update public.session_players
  set side = p_side, role = 'debater', last_seen_at = now()
  where session_id = p_session and user_id = v_uid and role <> 'spectator';
  update public.game_sessions set state_version = state_version + 1 where id = p_session;
end;
$$;

create or replace function public.join_session_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := public.debate_require_auth();
  sid uuid;
  profile_name text;
  player_count int;
  gs public.game_sessions;
  join_role text := 'debater';
begin
  if public.debate_user_in_live(v_uid, null) then perform public.debate_raise('already_in_session'); end if;

  select gs.* into gs
  from public.game_sessions gs
  where gs.room_code = upper(trim(p_code))
    and gs.status = 'active'
    and (gs.expires_at is null or gs.expires_at > now())
  limit 1;
  sid := gs.id;
  if sid is null then perform public.debate_raise('session_expired'); end if;
  if public.debate_is_member(sid, v_uid) then
    perform public.debate_touch_session(sid);
    return sid;
  end if;

  select count(*) into player_count from public.session_players where session_id = sid;
  if player_count >= coalesce(gs.max_players, 20) then perform public.debate_raise('session_full'); end if;

  if gs.phase in ('debating', 'verdict', 'results') then
    join_role := 'spectator';
  elsif gs.phase = 'picking' then
    join_role := 'debater';
  else
    join_role := 'debater';
  end if;

  select coalesce(display_name, 'Player') into profile_name from public.profiles where id = v_uid;
  insert into public.session_players (session_id, user_id, display_name, avatar_key, role)
  values (sid, v_uid, profile_name, (select avatar_key from public.profiles where id = v_uid), join_role);
  return sid;
end;
$$;

-- Replace auto-promote on leave
create or replace function public.debate_maybe_promote_judge(p_session uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.debate_promote_judge(p_session);
end;
$$;

revoke all on function public.get_session_state(uuid) from public;
grant execute on function public.get_session_state(uuid) to authenticated;
revoke all on function public.claim_judge(uuid) from public;
grant execute on function public.claim_judge(uuid) to authenticated;
revoke all on function public.next_round(uuid, text) from public;
grant execute on function public.next_round(uuid, text) to authenticated;
revoke all on function public.end_session(uuid, text) from public;
grant execute on function public.end_session(uuid, text) to authenticated;
revoke all on function public.finalize_round(uuid) from public;
grant execute on function public.finalize_round(uuid) to authenticated;

revoke all on function public.submit_verdict(uuid, text, uuid, text) from public;
grant execute on function public.submit_verdict(uuid, text, uuid, text) to authenticated;
revoke all on function public.change_verdict(uuid, text, uuid, text) from public;
grant execute on function public.change_verdict(uuid, text, uuid, text) to authenticated;
revoke all on function public.publish_verdict(uuid, text, uuid, text) from public;
grant execute on function public.publish_verdict(uuid, text, uuid, text) to authenticated;

revoke all on function public.draw_topic(uuid, text) from public;
grant execute on function public.draw_topic(uuid, text) to authenticated;
revoke all on function public.shuffle_topic(uuid, text) from public;
grant execute on function public.shuffle_topic(uuid, text) to authenticated;
revoke all on function public.confirm_topic(uuid, text) from public;
grant execute on function public.confirm_topic(uuid, text) to authenticated;
revoke all on function public.start_debate(uuid, text) from public;
grant execute on function public.start_debate(uuid, text) to authenticated;
revoke all on function public.request_verdict(uuid, text) from public;
grant execute on function public.request_verdict(uuid, text) to authenticated;
revoke all on function public.cancel_verdict(uuid, text) from public;
grant execute on function public.cancel_verdict(uuid, text) to authenticated;
revoke all on function public.pause_debate(uuid, text) from public;
grant execute on function public.pause_debate(uuid, text) to authenticated;
revoke all on function public.resume_debate(uuid, text) from public;
grant execute on function public.resume_debate(uuid, text) to authenticated;
revoke all on function public.set_soft_timer(uuid, int, text) from public;
grant execute on function public.set_soft_timer(uuid, int, text) to authenticated;
revoke all on function public.move_player(uuid, uuid, text, text) from public;
grant execute on function public.move_player(uuid, uuid, text, text) to authenticated;
revoke all on function public.set_judge(uuid, uuid, text) from public;
grant execute on function public.set_judge(uuid, uuid, text) to authenticated;
revoke all on function public.choose_side(uuid, text, text) from public;
grant execute on function public.choose_side(uuid, text, text) to authenticated;
