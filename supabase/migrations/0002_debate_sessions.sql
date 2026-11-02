-- Online Debate sessions for group play (run after 0001_init.sql).

create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  host_id uuid not null references auth.users (id) on delete cascade,
  deck_id text not null,
  status text not null default 'active' check (status in ('active', 'complete')),
  round_index int not null default 0,
  card_ids jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index game_sessions_group_id_idx on public.game_sessions (group_id);

create table public.game_session_players (
  session_id uuid not null references public.game_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  vote text check (vote is null or vote in ('agree', 'disagree')),
  ready boolean not null default false,
  primary key (session_id, user_id)
);

alter table public.game_sessions enable row level security;
alter table public.game_session_players enable row level security;

create policy game_sessions_select_member
  on public.game_sessions
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_session_players gsp
      where gsp.session_id = game_sessions.id
        and gsp.user_id = auth.uid()
    )
    or exists (
      select 1
      from public.group_members gm
      where gm.group_id = game_sessions.group_id
        and gm.user_id = auth.uid()
    )
  );

create policy game_session_players_select_member
  on public.game_session_players
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.game_session_players mine
      where mine.session_id = game_session_players.session_id
        and mine.user_id = auth.uid()
    )
  );

create policy game_session_players_update_own_vote
  on public.game_session_players
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- No direct insert on game_sessions / game_session_players (RPC only).

create or replace function public.start_group_debate(
  group_id uuid,
  deck_id text,
  card_ids jsonb
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  gid uuid := start_group_debate.group_id;
  sid uuid;
  card_count int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.group_members gm
    where gm.group_id = gid and gm.user_id = uid and gm.role = 'leader'
  ) then
    raise exception 'forbidden';
  end if;

  card_count := jsonb_array_length(coalesce(card_ids, '[]'::jsonb));
  if card_count < 1 or card_count > 12 then
    raise exception 'invalid_cards';
  end if;

  insert into public.game_sessions (group_id, host_id, deck_id, card_ids, status, round_index)
  values (gid, uid, start_group_debate.deck_id, card_ids, 'active', 0)
  returning id into sid;

  insert into public.game_session_players (session_id, user_id, ready)
  select sid, gm.user_id, false
  from public.group_members gm
  where gm.group_id = gid;

  return sid;
end;
$$;

grant execute on function public.start_group_debate(uuid, text, jsonb) to authenticated;

create or replace function public.cast_debate_vote(session_id uuid, vote text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  normalized text;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  normalized := lower(trim(vote));
  if normalized not in ('agree', 'disagree') then
    raise exception 'invalid_vote';
  end if;

  if not exists (
    select 1 from public.game_session_players gsp
    where gsp.session_id = cast_debate_vote.session_id and gsp.user_id = uid
  ) then
    raise exception 'not_in_session';
  end if;

  update public.game_session_players
  set vote = normalized
  where session_id = cast_debate_vote.session_id and user_id = uid;
end;
$$;

grant execute on function public.cast_debate_vote(uuid, text) to authenticated;

create or replace function public.advance_debate_round(session_id uuid)
returns int
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
  next_index int;
  max_index int;
begin
  if uid is null then
    raise exception 'not_authenticated';
  end if;

  if not exists (
    select 1 from public.game_sessions gs
    where gs.id = advance_debate_round.session_id and gs.host_id = uid
  ) then
    raise exception 'forbidden';
  end if;

  select gs.round_index, jsonb_array_length(gs.card_ids) - 1
  into next_index, max_index
  from public.game_sessions gs
  where gs.id = advance_debate_round.session_id
  for update;

  if next_index >= max_index then
    update public.game_sessions set status = 'complete' where id = advance_debate_round.session_id;
    return -1;
  end if;

  next_index := next_index + 1;
  update public.game_sessions
  set round_index = next_index
  where id = advance_debate_round.session_id;

  update public.game_session_players
  set vote = null
  where session_id = advance_debate_round.session_id;

  return next_index;
end;
$$;

grant execute on function public.advance_debate_round(uuid) to authenticated;
