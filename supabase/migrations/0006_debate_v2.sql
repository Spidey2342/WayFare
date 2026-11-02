-- Debate V2 rules (run after 0001–0005). Keeps legacy vote tables unused.

-- ---------------------------------------------------------------------------
-- Side + phase migration
-- ---------------------------------------------------------------------------
update public.session_players
set side = case
  when side = 'for' then 'agree'
  when side = 'against' then 'disagree'
  else side
end
where side in ('for', 'against');

alter table public.session_players drop constraint if exists session_players_side_check;
alter table public.session_players
  add constraint session_players_side_check check (
    side is null or side in ('agree', 'disagree')
  );

alter table public.session_players
  add column if not exists role text not null default 'debater'
    check (role in ('judge', 'debater', 'spectator'));

update public.game_sessions
set phase = case phase
  when 'side_reveal' then 'picking'
  when 'prep' then 'picking'
  when 'debate' then 'debating'
  when 'voting' then 'verdict'
  else phase
end;

alter table public.game_sessions drop constraint if exists game_sessions_phase_check;
alter table public.game_sessions
  add constraint game_sessions_phase_check check (
    phase in ('lobby', 'topic', 'picking', 'debating', 'verdict', 'results')
  );

alter table public.game_sessions
  add column if not exists judge_id uuid references auth.users (id) on delete set null,
  add column if not exists soft_timer_minutes int check (soft_timer_minutes is null or soft_timer_minutes in (3, 5, 10)),
  add column if not exists debate_started_at timestamptz,
  add column if not exists verdict_announced_at timestamptz;

alter table public.game_sessions alter column topic_id drop not null;

update public.game_sessions gs
set judge_id = coalesce(gs.judge_id, gs.host_id)
where gs.judge_id is null;

update public.debate_results
set winning_side = case winning_side
  when 'for' then 'agree'
  when 'against' then 'disagree'
  else winning_side
end
where winning_side in ('for', 'against');

-- ---------------------------------------------------------------------------
-- Topic history + verdicts
-- ---------------------------------------------------------------------------
create table if not exists public.group_topic_history (
  group_id uuid not null references public.groups (id) on delete cascade,
  topic_id text not null references public.debate_topics (id) on delete cascade,
  used_at timestamptz not null default now(),
  primary key (group_id, topic_id)
);

alter table public.group_topic_history enable row level security;

create policy group_topic_history_select_member
  on public.group_topic_history for select to authenticated
  using (
    exists (
      select 1 from public.group_members gm
      where gm.group_id = group_topic_history.group_id and gm.user_id = auth.uid()
    )
  );

create table if not exists public.debate_verdicts (
  session_id uuid primary key references public.game_sessions (id) on delete cascade,
  winning_side text not null check (winning_side in ('agree', 'disagree', 'draw')),
  mvp_user_id uuid references auth.users (id) on delete set null,
  decided_by uuid not null references auth.users (id) on delete cascade,
  decided_at timestamptz not null default now(),
  changed_at timestamptz
);

alter table public.debate_verdicts enable row level security;

create policy debate_verdicts_select_participant
  on public.debate_verdicts for select to authenticated
  using (
    exists (
      select 1 from public.session_players sp
      where sp.session_id = debate_verdicts.session_id and sp.user_id = auth.uid()
    )
    and exists (
      select 1 from public.game_sessions gs
      where gs.id = debate_verdicts.session_id
        and (gs.phase in ('verdict', 'results') or gs.status = 'finished')
    )
  );

-- Writes via SECURITY DEFINER RPCs only (no insert policy for authenticated).

alter table public.profiles
  add column if not exists debates_judged int not null default 0,
  add column if not exists guest_progress_merged_at timestamptz;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.debate_is_judge(p_session uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select gs.judge_id = p_user from public.game_sessions gs where gs.id = p_session),
    false
  );
$$;

create or replace function public.debate_group_leader(p_group uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select gm.user_id
      from public.group_members gm
      where gm.group_id = p_group and gm.role = 'leader'
      order by gm.joined_at asc nulls last
      limit 1
    ),
    (select g.owner_id from public.groups g where g.id = p_group)
  );
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
  if gs.id is null then raise exception 'Session not found'; end if;
  if gs.status <> 'active' then raise exception 'Session not active'; end if;
  if gs.expires_at is not null and gs.expires_at < now() then
    raise exception 'Session expired';
  end if;
  return gs;
end;
$$;

create or replace function public.debate_user_in_live(p_user uuid, p_exclude uuid default null)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.session_players sp
    join public.game_sessions gs on gs.id = sp.session_id
    where sp.user_id = p_user
      and gs.status = 'active'
      and gs.phase not in ('results')
      and (p_exclude is null or gs.id <> p_exclude)
  );
$$;

create or replace function public.debate_pick_topic_for_group(p_group uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  picked text;
  total int;
  used int;
begin
  select count(*) into total from public.debate_topics t where t.is_published;
  select count(*) into used from public.group_topic_history h where h.group_id = p_group;
  if used >= total and total > 0 then
    delete from public.group_topic_history where group_id = p_group;
  end if;
  select t.id into picked
  from public.debate_topics t
  where t.is_published
    and not exists (
      select 1 from public.group_topic_history h
      where h.group_id = p_group and h.topic_id = t.id
    )
  order by random()
  limit 1;
  if picked is null then
    select t.id into picked from public.debate_topics t where t.is_published order by random() limit 1;
  end if;
  return picked;
end;
$$;

create or replace function public.debate_pick_topic_global()
returns text
language sql
security definer
set search_path = ''
as $$
  select t.id
  from public.debate_topics t
  where t.is_published
  order by random()
  limit 1;
$$;

create or replace function public.debate_side_counts(p_session uuid)
returns table (agree int, disagree int)
language sql
stable
security definer
set search_path = ''
as $$
  select
    count(*) filter (where sp.side = 'agree' and sp.role = 'debater')::int,
    count(*) filter (where sp.side = 'disagree' and sp.role = 'debater')::int
  from public.session_players sp
  where sp.session_id = p_session;
$$;

create or replace function public.debate_maybe_promote_judge(p_session uuid)
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
  select * into gs from public.game_sessions where id = p_session;
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
      update public.game_sessions set judge_id = replacement where id = p_session;
      update public.session_players set role = 'judge', side = null
      where session_id = p_session and user_id = replacement;
      update public.session_players set role = 'debater'
      where session_id = p_session and user_id = judge and role = 'judge';
      return replacement;
    end if;
  end if;
  select sp.user_id into replacement
  from public.session_players sp
  where sp.session_id = p_session and sp.user_id <> judge
  order by sp.connected_at asc
  limit 1;
  if replacement is not null then
    update public.game_sessions set judge_id = replacement where id = p_session;
    update public.session_players set role = 'judge', side = null
    where session_id = p_session and user_id = replacement;
    update public.session_players set role = 'debater'
    where session_id = p_session and user_id = judge and role = 'judge';
  end if;
  return replacement;
end;
$$;

-- ---------------------------------------------------------------------------
-- create_debate_session (V2)
-- ---------------------------------------------------------------------------
create or replace function public.create_debate_session(
  p_group_id uuid,
  p_topic_id text default null,
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
  leader uuid;
  picked text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if public.debate_user_in_live(uid, null) then raise exception 'already_in_debate'; end if;

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
    leader := public.debate_group_leader(p_group_id);
  end if;

  picked := p_topic_id;
  if picked is not null and not exists (
    select 1 from public.debate_topics t where t.id = picked and t.is_published
  ) then
    raise exception 'Unknown topic';
  end if;

  code := public.generate_join_code();
  insert into public.game_sessions (
    group_id, host_id, judge_id, topic_id, room_code, expires_at, config, phase, last_heartbeat_at
  )
  values (
    p_group_id,
    uid,
    coalesce(leader, uid),
    picked,
    code,
    now() + interval '4 hours',
    coalesce(p_config, '{}'::jsonb),
    case when picked is null then 'lobby' else 'topic' end,
    now()
  )
  returning id into sid;

  select coalesce(display_name, 'Player') into profile_name from public.profiles where id = uid;
  insert into public.session_players (session_id, user_id, display_name, avatar_key, role)
  values (
    sid,
    uid,
    profile_name,
    (select avatar_key from public.profiles where id = uid),
    case when coalesce(leader, uid) = uid then 'judge' else 'debater' end
  )
  on conflict do nothing;

  if coalesce(leader, uid) <> uid then
    insert into public.session_players (session_id, user_id, display_name, avatar_key, role)
    select sid, leader, coalesce(p.display_name, 'Player'), p.avatar_key, 'judge'
    from public.profiles p where p.id = leader
    on conflict do nothing;
  end if;

  if p_group_id is not null then
    update public.groups set last_activity_at = now() where id = p_group_id;
  end if;
  return sid;
end;
$$;

-- ---------------------------------------------------------------------------
-- join_session_by_code (cap 20, spectator on late join)
-- ---------------------------------------------------------------------------
create or replace function public.join_session_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  sid uuid;
  profile_name text;
  player_count int;
  gs public.game_sessions;
  join_role text := 'debater';
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if public.debate_user_in_live(uid, null) then raise exception 'already_in_debate'; end if;

  select gs.* into gs
  from public.game_sessions gs
  where gs.room_code = upper(trim(p_code))
    and gs.status = 'active'
    and (gs.expires_at is null or gs.expires_at > now())
  limit 1;
  sid := gs.id;
  if sid is null then raise exception 'Invalid or expired code'; end if;
  if public.debate_is_member(sid, uid) then
    perform public.debate_touch_session(sid);
    return sid;
  end if;

  select count(*) into player_count from public.session_players where session_id = sid;
  if player_count >= 20 then raise exception 'Session is full'; end if;

  if gs.phase in ('debating', 'verdict') then
    join_role := 'spectator';
  elsif gs.phase = 'picking' then
    join_role := 'debater';
  else
    join_role := 'debater';
  end if;

  select coalesce(display_name, 'Player') into profile_name from public.profiles where id = uid;
  insert into public.session_players (session_id, user_id, display_name, avatar_key, role)
  values (sid, uid, profile_name, (select avatar_key from public.profiles where id = uid), join_role);
  return sid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Heartbeat + judge promotion
-- ---------------------------------------------------------------------------
create or replace function public.debate_touch_session(p_session uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  new_judge uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.debate_is_member(p_session, uid) then raise exception 'Not in session'; end if;
  update public.session_players set last_seen_at = now() where session_id = p_session and user_id = uid;
  update public.game_sessions set last_heartbeat_at = now() where id = p_session;
  new_judge := public.debate_maybe_promote_judge(p_session);
  return new_judge;
end;
$$;

revoke all on function public.debate_touch_session(uuid) from public;
grant execute on function public.debate_touch_session(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Topic RPCs
-- ---------------------------------------------------------------------------
create or replace function public.draw_topic(p_session uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
  picked text;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if gs.phase not in ('lobby', 'topic') then raise exception 'Wrong phase'; end if;

  if gs.group_id is not null then
    picked := public.debate_pick_topic_for_group(gs.group_id);
  else
    picked := public.debate_pick_topic_global();
  end if;
  if picked is null then raise exception 'No topics'; end if;

  update public.game_sessions set topic_id = picked, phase = 'topic' where id = p_session;
  if gs.group_id is not null then
    insert into public.group_topic_history (group_id, topic_id) values (gs.group_id, picked)
    on conflict do nothing;
  end if;
  return picked;
end;
$$;

create or replace function public.shuffle_topic(p_session uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
begin
  return public.draw_topic(p_session);
end;
$$;

create or replace function public.confirm_topic(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if gs.topic_id is null then raise exception 'No topic'; end if;
  if gs.phase not in ('lobby', 'topic') then raise exception 'Wrong phase'; end if;
  update public.game_sessions set phase = 'picking' where id = p_session;
end;
$$;

revoke all on function public.confirm_topic(uuid) from public;
grant execute on function public.confirm_topic(uuid) to authenticated;

revoke all on function public.draw_topic(uuid) from public;
grant execute on function public.draw_topic(uuid) to authenticated;
revoke all on function public.shuffle_topic(uuid) from public;
grant execute on function public.shuffle_topic(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Side + judge + timer + start
-- ---------------------------------------------------------------------------
create or replace function public.choose_side(p_session uuid, p_side text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  if gs.phase <> 'picking' then raise exception 'Wrong phase'; end if;
  if p_side not in ('agree', 'disagree') then raise exception 'Invalid side'; end if;
  if public.debate_is_judge(p_session, uid) then raise exception 'Judge does not pick a side'; end if;
  if not public.debate_is_member(p_session, uid) then raise exception 'Not in session'; end if;

  update public.session_players
  set side = p_side, role = 'debater', last_seen_at = now()
  where session_id = p_session and user_id = uid and role <> 'spectator';
end;
$$;

create or replace function public.move_player(p_session uuid, p_user uuid, p_side text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if gs.phase <> 'picking' then raise exception 'Wrong phase'; end if;
  if p_side not in ('agree', 'disagree') then raise exception 'Invalid side'; end if;
  update public.session_players
  set side = p_side, role = 'debater', last_seen_at = now()
  where session_id = p_session and user_id = p_user and role <> 'spectator';
end;
$$;

create or replace function public.set_judge(p_session uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if not public.debate_is_member(p_session, p_user) then raise exception 'Not in session'; end if;

  update public.session_players set role = 'debater' where session_id = p_session and role = 'judge';
  update public.game_sessions set judge_id = p_user where id = p_session;
  update public.session_players set role = 'judge', side = null
  where session_id = p_session and user_id = p_user;
end;
$$;

create or replace function public.set_soft_timer(p_session uuid, p_minutes int)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if p_minutes is not null and p_minutes not in (3, 5, 10) then raise exception 'Invalid timer'; end if;
  update public.game_sessions set soft_timer_minutes = p_minutes where id = p_session;
end;
$$;

create or replace function public.start_debate(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
  c record;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if gs.phase <> 'picking' then raise exception 'Wrong phase'; end if;
  select * into c from public.debate_side_counts(p_session);
  if coalesce(c.agree, 0) < 1 or coalesce(c.disagree, 0) < 1 then
    raise exception 'Need one player on each side';
  end if;
  update public.game_sessions
  set phase = 'debating', debate_started_at = now(), phase_ends_at = null
  where id = p_session;
end;
$$;

create or replace function public.request_verdict(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if gs.phase <> 'debating' then raise exception 'Wrong phase'; end if;
  update public.game_sessions set phase = 'verdict' where id = p_session;
end;
$$;

-- ---------------------------------------------------------------------------
-- Verdict + finalize (server-side XP once)
-- ---------------------------------------------------------------------------
create or replace function public.submit_verdict(
  p_session uuid,
  p_winning_side text,
  p_mvp_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  if gs.phase <> 'verdict' then raise exception 'Wrong phase'; end if;
  if p_winning_side not in ('agree', 'disagree', 'draw') then raise exception 'Invalid side'; end if;
  if p_mvp_user_id is not null and not exists (
    select 1 from public.session_players sp
    where sp.session_id = p_session and sp.user_id = p_mvp_user_id and sp.role = 'debater'
  ) then
    raise exception 'MVP must be a debater';
  end if;

  insert into public.debate_verdicts (session_id, winning_side, mvp_user_id, decided_by)
  values (p_session, p_winning_side, p_mvp_user_id, uid)
  on conflict (session_id) do update set
    winning_side = excluded.winning_side,
    mvp_user_id = excluded.mvp_user_id,
    decided_by = excluded.decided_by,
    decided_at = now(),
    changed_at = null;

  update public.game_sessions set verdict_announced_at = now() where id = p_session;
end;
$$;

create or replace function public.change_verdict(
  p_session uuid,
  p_winning_side text,
  p_mvp_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs public.game_sessions;
  v record;
begin
  gs := public.debate_assert_live(p_session);
  if not public.debate_is_judge(p_session, uid) then raise exception 'Judge only'; end if;
  select * into v from public.debate_verdicts where session_id = p_session;
  if v.session_id is null then raise exception 'No verdict'; end if;
  if v.decided_at < now() - interval '30 seconds' then raise exception 'Change window closed'; end if;
  if p_mvp_user_id is not null and not exists (
    select 1 from public.session_players sp
    where sp.session_id = p_session and sp.user_id = p_mvp_user_id and sp.role = 'debater'
  ) then
    raise exception 'MVP must be a debater';
  end if;
  update public.debate_verdicts
  set winning_side = p_winning_side, mvp_user_id = p_mvp_user_id, changed_at = now()
  where session_id = p_session;
end;
$$;

create or replace function public.finalize_debate(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  gs public.game_sessions;
  v record;
  rec record;
  xp_gain int;
  side_win text;
  agree_n int;
  disagree_n int;
begin
  select * into gs from public.game_sessions where id = p_session for update;
  if gs.xp_awarded then return; end if;
  select * into v from public.debate_verdicts where session_id = p_session;
  if v.session_id is null then raise exception 'No verdict'; end if;

  side_win := v.winning_side;
  select c.agree, c.disagree into agree_n, disagree_n
  from public.debate_side_counts(p_session) as c;

  insert into public.debate_results (session_id, winning_side, tie, side_totals, player_totals, mvp_ids)
  values (
    p_session,
    case when side_win = 'draw' then null else side_win end,
    side_win = 'draw',
    jsonb_build_object('agree', agree_n, 'disagree', disagree_n),
    '{}'::jsonb,
    case when v.mvp_user_id is null then '{}'::uuid[] else array[v.mvp_user_id] end
  )
  on conflict (session_id) do nothing;

  for rec in select user_id, side, role from public.session_players where session_id = p_session loop
    xp_gain := 0;
    if rec.role = 'judge' then
      xp_gain := 1;
    elsif rec.role = 'debater' then
      xp_gain := 1;
      if side_win = 'draw' then
        xp_gain := xp_gain + 2;
      elsif rec.side = side_win then
        xp_gain := xp_gain + 3;
      end if;
      if v.mvp_user_id = rec.user_id then xp_gain := xp_gain + 2; end if;
    elsif rec.role = 'spectator' then
      xp_gain := 0;
    end if;
    if xp_gain > 0 then
      update public.profiles p set xp = p.xp + xp_gain where p.id = rec.user_id;
    end if;
  end loop;

  update public.profiles p
  set debates_judged = p.debates_judged + 1
  where p.id = v.decided_by;

  update public.game_sessions
  set status = 'finished', phase = 'results', finished_at = now(), xp_awarded = true
  where id = p_session;
end;
$$;

create or replace function public.publish_verdict(
  p_session uuid,
  p_winning_side text,
  p_mvp_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.submit_verdict(p_session, p_winning_side, p_mvp_user_id);
  perform public.finalize_debate(p_session);
end;
$$;

revoke all on function public.publish_verdict(uuid, text, uuid) from public;
grant execute on function public.publish_verdict(uuid, text, uuid) to authenticated;

revoke all on function public.choose_side(uuid, text) from public;
grant execute on function public.choose_side(uuid, text) to authenticated;
revoke all on function public.move_player(uuid, uuid, text) from public;
grant execute on function public.move_player(uuid, uuid, text) to authenticated;
revoke all on function public.set_judge(uuid, uuid) from public;
grant execute on function public.set_judge(uuid, uuid) to authenticated;
revoke all on function public.set_soft_timer(uuid, int) from public;
grant execute on function public.set_soft_timer(uuid, int) to authenticated;
revoke all on function public.start_debate(uuid) from public;
grant execute on function public.start_debate(uuid) to authenticated;
revoke all on function public.request_verdict(uuid) from public;
grant execute on function public.request_verdict(uuid) to authenticated;
revoke all on function public.submit_verdict(uuid, text, uuid) from public;
grant execute on function public.submit_verdict(uuid, text, uuid) to authenticated;
revoke all on function public.change_verdict(uuid, text, uuid) from public;
grant execute on function public.change_verdict(uuid, text, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- leave_session (V2)
-- ---------------------------------------------------------------------------
create or replace function public.leave_session(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  remaining int;
  gs public.game_sessions;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into gs from public.game_sessions where id = p_session;
  delete from public.session_players where session_id = p_session and user_id = uid;
  select count(*) into remaining from public.session_players where session_id = p_session;
  if remaining = 0 and gs.status = 'active' then
    update public.game_sessions set status = 'cancelled', phase = 'results', finished_at = now() where id = p_session;
  end if;
  perform public.debate_maybe_promote_judge(p_session);
end;
$$;

-- ---------------------------------------------------------------------------
-- Guest progress merge (once per account)
-- ---------------------------------------------------------------------------
create or replace function public.merge_guest_progress(p_xp int, p_badges jsonb default '[]'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  cap_xp int := greatest(0, least(coalesce(p_xp, 0), 5000));
  merged_badges jsonb := coalesce(p_badges, '[]'::jsonb);
  current_xp int;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select xp into current_xp from public.profiles where id = uid for update;
  if exists (select 1 from public.profiles where id = uid and guest_progress_merged_at is not null) then
    return jsonb_build_object('merged', false, 'reason', 'already_merged');
  end if;
  update public.profiles
  set
    xp = greatest(xp, cap_xp),
    guest_progress_merged_at = now()
  where id = uid;
  return jsonb_build_object('merged', true, 'xp', greatest(current_xp, cap_xp));
end;
$$;

revoke all on function public.merge_guest_progress(int, jsonb) from public;
grant execute on function public.merge_guest_progress(int, jsonb) to authenticated;

-- Legacy vote RPCs remain but are unused by the app.
