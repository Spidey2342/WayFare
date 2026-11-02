-- Wayfare Debate game (run after 0001_init.sql).
-- Replaces any prior 0002 debate prototype tables.

drop table if exists public.game_session_players cascade;
drop table if exists public.debate_votes cascade;
drop table if exists public.debate_results cascade;
drop table if exists public.session_players cascade;
drop table if exists public.game_sessions cascade;

drop function if exists public.start_group_debate(uuid, text, jsonb);
drop function if exists public.cast_debate_vote(uuid, text);
drop function if exists public.advance_debate_round(uuid);

-- ---------------------------------------------------------------------------
-- Topics
-- ---------------------------------------------------------------------------
create table public.debate_topics (
  id text primary key,
  text text not null,
  category text not null,
  difficulty text not null check (difficulty in ('light', 'medium', 'deep')),
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.debate_topics enable row level security;

create policy debate_topics_select_published
  on public.debate_topics
  for select
  to authenticated
  using (is_published = true);

insert into public.debate_topics (id, text, category, difficulty) values
  ('topic-01', 'Is social media doing more harm than good for youth ministries?', 'culture', 'medium'),
  ('topic-02', 'Should phones be allowed during church services?', 'church', 'light'),
  ('topic-03', 'Is it better to serve in secret than to be seen serving?', 'character', 'medium'),
  ('topic-04', 'Is it ever okay to skip church to study for exams?', 'church', 'medium'),
  ('topic-05', 'Do worship songs matter more than the sermon?', 'worship', 'light'),
  ('topic-06', 'Should young people lead the main Sunday service once a month?', 'church', 'medium'),
  ('topic-07', 'Is it more important to know the Bible by heart or to live it out?', 'scripture', 'deep'),
  ('topic-08', 'Should Christians avoid secular music completely?', 'culture', 'medium'),
  ('topic-09', 'Is it better to have a few close Christian friends or many acquaintances?', 'relationships', 'light'),
  ('topic-10', 'Is online church as good as in-person church?', 'church', 'medium'),
  ('topic-11', 'Is working hard for money compatible with putting God first?', 'life', 'deep'),
  ('topic-12', 'Should church services be capped at two hours?', 'church', 'light')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Sessions
-- ---------------------------------------------------------------------------
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references public.groups (id) on delete set null,
  host_id uuid not null references auth.users (id) on delete cascade,
  game_type text not null default 'debate' check (game_type = 'debate'),
  topic_id text not null references public.debate_topics (id),
  status text not null default 'active' check (status in ('active', 'finished', 'cancelled')),
  phase text not null default 'lobby' check (
    phase in ('lobby', 'side_reveal', 'prep', 'debate', 'voting', 'results')
  ),
  phase_ends_at timestamptz,
  config jsonb not null default '{"prepSeconds":30,"debateSeconds":120,"votingSeconds":30,"debateExtensionSeconds":30,"debateExtended":false}'::jsonb,
  ready_to_vote uuid[] not null default '{}',
  room_code char(6) unique,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  xp_awarded boolean not null default false
);

create index game_sessions_room_code_idx on public.game_sessions (room_code);
create index game_sessions_group_id_idx on public.game_sessions (group_id);

alter table public.game_sessions enable row level security;

create table public.session_players (
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_key text,
  side text check (side is null or side in ('for', 'against')),
  is_ready boolean not null default false,
  ready_to_vote boolean not null default false,
  last_seen_at timestamptz not null default now(),
  connected_at timestamptz not null default now(),
  primary key (session_id, user_id)
);

alter table public.session_players enable row level security;

create table public.debate_votes (
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  voter_id uuid not null references auth.users (id) on delete cascade,
  voted_for uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, voter_id),
  check (voter_id <> voted_for)
);

alter table public.debate_votes enable row level security;

create table public.debate_results (
  session_id uuid primary key references public.game_sessions (id) on delete cascade,
  winning_side text,
  tie boolean not null default false,
  side_totals jsonb not null default '{}'::jsonb,
  player_totals jsonb not null default '{}'::jsonb,
  mvp_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.debate_results enable row level security;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------
create or replace function public.debate_is_member(p_session uuid, p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.session_players sp
    where sp.session_id = p_session and sp.user_id = p_user
  );
$$;

revoke all on function public.debate_is_member(uuid, uuid) from public;
grant execute on function public.debate_is_member(uuid, uuid) to authenticated;

create or replace function public.debate_session_expired(p_session uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select gs.expires_at is not null and gs.expires_at < now() from public.game_sessions gs where gs.id = p_session),
    true
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS policies
-- ---------------------------------------------------------------------------
create policy game_sessions_select_member
  on public.game_sessions for select to authenticated
  using (public.debate_is_member(id, auth.uid()));

create policy session_players_select_member
  on public.session_players for select to authenticated
  using (public.debate_is_member(session_id, auth.uid()));

create policy session_players_update_self
  on public.session_players for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy debate_votes_select_own_or_finished
  on public.debate_votes for select to authenticated
  using (
    voter_id = auth.uid()
    or exists (
      select 1 from public.game_sessions gs
      where gs.id = debate_votes.session_id and gs.status = 'finished'
    )
  );

create policy debate_results_select_member_when_finished
  on public.debate_results for select to authenticated
  using (
    public.debate_is_member(session_id, auth.uid())
    and exists (
      select 1 from public.game_sessions gs
      where gs.id = debate_results.session_id and gs.status = 'finished'
    )
  );

-- No direct insert/delete on sessions, votes, results (RPC only).

-- ---------------------------------------------------------------------------
-- RPC: create_debate_session
-- ---------------------------------------------------------------------------
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
  if p_group_id is not null and not exists (
    select 1 from public.group_members gm where gm.group_id = p_group_id and gm.user_id = uid
  ) then
    raise exception 'Not a group member';
  end if;
  code := public.generate_join_code();
  insert into public.game_sessions (group_id, host_id, topic_id, room_code, expires_at, config)
  values (
    p_group_id,
    uid,
    p_topic_id,
    code,
    now() + interval '4 hours',
    coalesce(p_config, '{}'::jsonb) || jsonb_build_object('debateExtended', false)
  )
  returning id into sid;
  select coalesce(display_name, 'Player') into profile_name from public.profiles where id = uid;
  insert into public.session_players (session_id, user_id, display_name, avatar_key)
  select sid, uid, profile_name, avatar_key from public.profiles where id = uid;
  return sid;
end;
$$;

revoke all on function public.create_debate_session(uuid, text, jsonb) from public;
grant execute on function public.create_debate_session(uuid, text, jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: join_session_by_code
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
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select gs.id into sid
  from public.game_sessions gs
  where gs.room_code = upper(trim(p_code))
    and gs.status = 'active'
    and (gs.expires_at is null or gs.expires_at > now())
  limit 1;
  if sid is null then raise exception 'Invalid or expired code'; end if;
  if public.debate_is_member(sid, uid) then return sid; end if;
  select count(*) into player_count from public.session_players where session_id = sid;
  if player_count >= 8 then raise exception 'Session is full'; end if;
  select coalesce(display_name, 'Player') into profile_name from public.profiles where id = uid;
  insert into public.session_players (session_id, user_id, display_name, avatar_key)
  values (sid, uid, profile_name, (select avatar_key from public.profiles where id = uid));
  return sid;
end;
$$;

revoke all on function public.join_session_by_code(text) from public;
grant execute on function public.join_session_by_code(text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: set_ready
-- ---------------------------------------------------------------------------
create or replace function public.set_ready(p_session uuid, p_ready boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.debate_is_member(p_session, uid) then raise exception 'Not in session'; end if;
  update public.session_players
  set is_ready = p_ready, last_seen_at = now()
  where session_id = p_session and user_id = uid;
end;
$$;

revoke all on function public.set_ready(uuid, boolean) from public;
grant execute on function public.set_ready(uuid, boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: assign_sides (host, random balanced)
-- ---------------------------------------------------------------------------
create or replace function public.assign_sides(p_session uuid, p_mode text default 'random_balanced')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  host uuid;
  ids uuid[];
  i int;
  for_count int;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select host_id into host from public.game_sessions where id = p_session;
  if host <> uid then raise exception 'Host only'; end if;
  if p_mode <> 'random_balanced' then raise exception 'Unsupported mode'; end if;
  select array_agg(user_id order by random()) into ids from public.session_players where session_id = p_session;
  if array_length(ids, 1) < 2 then raise exception 'Need at least two players'; end if;
  for_count := (array_length(ids, 1) + 1) / 2;
  for i in 1..array_length(ids, 1) loop
    update public.session_players
    set side = case when i <= for_count then 'for' else 'against' end
    where session_id = p_session and user_id = ids[i];
  end loop;
  update public.game_sessions set phase = 'side_reveal' where id = p_session;
end;
$$;

revoke all on function public.assign_sides(uuid, text) from public;
grant execute on function public.assign_sides(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: advance_phase
-- ---------------------------------------------------------------------------
create or replace function public.advance_phase(p_session uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs record;
  prep_sec int;
  debate_sec int;
  vote_sec int;
  next_phase text;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into gs from public.game_sessions where id = p_session for update;
  if not public.debate_is_member(p_session, uid) then raise exception 'Not in session'; end if;
  if gs.host_id <> uid and (gs.phase_ends_at is null or gs.phase_ends_at > now()) then
    raise exception 'Wait for timer or host';
  end if;
  prep_sec := coalesce((gs.config->>'prepSeconds')::int, 30);
  debate_sec := coalesce((gs.config->>'debateSeconds')::int, 120);
  vote_sec := coalesce((gs.config->>'votingSeconds')::int, 30);
  if (gs.config->>'debateExtended')::boolean then
    debate_sec := debate_sec + coalesce((gs.config->>'debateExtensionSeconds')::int, 30);
  end if;
  next_phase := case gs.phase
    when 'lobby' then 'side_reveal'
    when 'side_reveal' then 'prep'
    when 'prep' then 'debate'
    when 'debate' then 'voting'
    when 'voting' then 'results'
    else gs.phase
  end;
  update public.game_sessions
  set
    phase = next_phase,
    phase_ends_at = case next_phase
      when 'prep' then now() + make_interval(secs => prep_sec)
      when 'debate' then now() + make_interval(secs => debate_sec)
      when 'voting' then now() + make_interval(secs => vote_sec)
      else null
    end,
    ready_to_vote = case when next_phase = 'debate' then '{}'::uuid[] else ready_to_vote end
  where id = p_session;
  if next_phase = 'results' then
    perform public.finalize_debate(p_session);
  end if;
  return next_phase;
end;
$$;

revoke all on function public.advance_phase(uuid) from public;
grant execute on function public.advance_phase(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: extend_debate
-- ---------------------------------------------------------------------------
create or replace function public.extend_debate(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs record;
  extra int;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into gs from public.game_sessions where id = p_session for update;
  if gs.host_id <> uid then raise exception 'Host only'; end if;
  if gs.phase <> 'debate' then raise exception 'Not in debate phase'; end if;
  if (gs.config->>'debateExtended')::boolean then raise exception 'Already extended'; end if;
  extra := coalesce((gs.config->>'debateExtensionSeconds')::int, 30);
  update public.game_sessions
  set
    config = gs.config || jsonb_build_object('debateExtended', true),
    phase_ends_at = coalesce(phase_ends_at, now()) + make_interval(secs => extra)
  where id = p_session;
end;
$$;

revoke all on function public.extend_debate(uuid) from public;
grant execute on function public.extend_debate(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: mark_debate_ready_to_vote
-- ---------------------------------------------------------------------------
create or replace function public.mark_debate_ready_to_vote(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs record;
  total int;
  ready int;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  if not public.debate_is_member(p_session, uid) then raise exception 'Not in session'; end if;
  select * into gs from public.game_sessions where id = p_session for update;
  if gs.phase <> 'debate' then raise exception 'Not in debate phase'; end if;
  update public.session_players set ready_to_vote = true, last_seen_at = now()
  where session_id = p_session and user_id = uid;
  select count(*) into total from public.session_players where session_id = p_session;
  select count(*) into ready from public.session_players where session_id = p_session and ready_to_vote;
  if ready >= total then
    perform public.advance_phase(p_session);
  end if;
end;
$$;

revoke all on function public.mark_debate_ready_to_vote(uuid) from public;
grant execute on function public.mark_debate_ready_to_vote(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: submit_vote
-- ---------------------------------------------------------------------------
create or replace function public.submit_vote(p_session uuid, p_voted_for uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gs record;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into gs from public.game_sessions where id = p_session;
  if gs.phase <> 'voting' then raise exception 'Not in voting phase'; end if;
  if uid = p_voted_for then raise exception 'No self votes'; end if;
  if not public.debate_is_member(p_session, uid) then raise exception 'Not in session'; end if;
  if not public.debate_is_member(p_session, p_voted_for) then raise exception 'Invalid candidate'; end if;
  insert into public.debate_votes (session_id, voter_id, voted_for)
  values (p_session, uid, p_voted_for)
  on conflict (session_id, voter_id) do update set voted_for = excluded.voted_for;
end;
$$;

revoke all on function public.submit_vote(uuid, uuid) from public;
grant execute on function public.submit_vote(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: finalize_debate
-- ---------------------------------------------------------------------------
create or replace function public.finalize_debate(p_session uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  gs record;
  for_total int := 0;
  against_total int := 0;
  max_votes int := 0;
  mvp uuid[];
  winning text;
  tie_flag boolean := false;
  rec record;
  xp_gain int;
begin
  select * into gs from public.game_sessions where id = p_session for update;
  if gs.xp_awarded then return; end if;
  for rec in
    select sp.user_id, sp.side, coalesce(v.cnt, 0) as votes
    from public.session_players sp
    left join (
      select voted_for, count(*) as cnt from public.debate_votes where session_id = p_session group by voted_for
    ) v on v.voted_for = sp.user_id
    where sp.session_id = p_session
  loop
    if rec.side = 'for' then for_total := for_total + rec.votes; end if;
    if rec.side = 'against' then against_total := against_total + rec.votes; end if;
    if rec.votes > max_votes then max_votes := rec.votes; end if;
  end loop;
  if for_total > against_total then winning := 'for';
  elsif against_total > for_total then winning := 'against';
  else tie_flag := true; winning := null;
  end if;
  select coalesce(array_agg(sp.user_id), '{}') into mvp
  from public.session_players sp
  left join (
    select voted_for, count(*) as cnt from public.debate_votes where session_id = p_session group by voted_for
  ) v on v.voted_for = sp.user_id
  where sp.session_id = p_session and coalesce(v.cnt, 0) = max_votes and max_votes > 0;
  insert into public.debate_results (session_id, winning_side, tie, side_totals, player_totals, mvp_ids)
  values (
    p_session,
    winning,
    tie_flag,
    jsonb_build_object('for', for_total, 'against', against_total),
    (
      select coalesce(jsonb_object_agg(sp.user_id::text, coalesce(v.cnt, 0)), '{}'::jsonb)
      from public.session_players sp
      left join (
        select voted_for, count(*) as cnt from public.debate_votes where session_id = p_session group by voted_for
      ) v on v.voted_for = sp.user_id
      where sp.session_id = p_session
    ),
    mvp
  )
  on conflict (session_id) do nothing;
  for rec in select user_id, side from public.session_players where session_id = p_session loop
    xp_gain := 1;
    if not tie_flag and rec.side = winning then xp_gain := xp_gain + 3; end if;
    if rec.user_id = any(mvp) then xp_gain := xp_gain + 2; end if;
    update public.profiles p set xp = p.xp + xp_gain where p.id = rec.user_id;
  end loop;
  update public.game_sessions set status = 'finished', phase = 'results', finished_at = now(), xp_awarded = true
  where id = p_session;
end;
$$;

revoke all on function public.finalize_debate(uuid) from public;
grant execute on function public.finalize_debate(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: leave_session
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
  gs record;
  new_host uuid;
begin
  if uid is null then raise exception 'Not authenticated'; end if;
  select * into gs from public.game_sessions where id = p_session;
  delete from public.session_players where session_id = p_session and user_id = uid;
  select count(*) into remaining from public.session_players where session_id = p_session;
  if remaining < 2 and gs.status = 'active' then
    update public.game_sessions set status = 'cancelled', phase = 'results', finished_at = now() where id = p_session;
  elsif gs.host_id = uid then
    select user_id into new_host
    from public.session_players
    where session_id = p_session
    order by connected_at asc
    limit 1;
    if new_host is not null then
      update public.game_sessions set host_id = new_host where id = p_session;
    end if;
  end if;
end;
$$;

revoke all on function public.leave_session(uuid) from public;
grant execute on function public.leave_session(uuid) to authenticated;
