import { requireSupabase } from '@/services/supabase';

export type OnlineDebateSessionRow = {
  id: string;
  group_id: string | null;
  host_id: string;
  topic_id: string;
  status: 'active' | 'finished' | 'cancelled';
  phase: 'lobby' | 'side_reveal' | 'prep' | 'debate' | 'voting' | 'results';
  phase_ends_at: string | null;
  config: Record<string, unknown>;
  room_code: string | null;
  ready_to_vote: string[];
};

export type OnlineSessionPlayerRow = {
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_key: string | null;
  side: 'for' | 'against' | null;
  is_ready: boolean;
  ready_to_vote: boolean;
  last_seen_at: string;
};

export type DebateResultsRow = {
  session_id: string;
  winning_side: string | null;
  tie: boolean;
  side_totals: { for?: number; against?: number };
  player_totals: Record<string, number>;
  mvp_ids: string[];
};

export async function rpcServerNow(): Promise<string> {
  const { data, error } = await requireSupabase().rpc('server_now');
  if (error) throw error;
  return data as string;
}

export async function rpcCreateDebateSession(
  groupId: string | null,
  topicId: string,
  config?: Record<string, unknown>,
) {
  const { data, error } = await requireSupabase().rpc('create_debate_session', {
    p_group_id: groupId,
    p_topic_id: topicId,
    p_config: config ?? {},
  });
  if (error) throw error;
  return data as string;
}

export async function rpcJoinSessionByCode(code: string) {
  const { data, error } = await requireSupabase().rpc('join_session_by_code', { p_code: code });
  if (error) throw error;
  return data as string;
}

export async function rpcSetReady(sessionId: string, ready: boolean) {
  const { error } = await requireSupabase().rpc('set_ready', {
    p_session: sessionId,
    p_ready: ready,
  });
  if (error) throw error;
}

export async function rpcAssignSides(sessionId: string) {
  const { error } = await requireSupabase().rpc('assign_sides', {
    p_session: sessionId,
    p_mode: 'random_balanced',
  });
  if (error) throw error;
}

export async function rpcAdvancePhase(sessionId: string) {
  const { data, error } = await requireSupabase().rpc('advance_phase', { p_session: sessionId });
  if (error) throw error;
  return data as string;
}

export async function rpcExtendDebate(sessionId: string) {
  const { error } = await requireSupabase().rpc('extend_debate', { p_session: sessionId });
  if (error) throw error;
}

export async function rpcMarkDebateReadyToVote(sessionId: string) {
  const { error } = await requireSupabase().rpc('mark_debate_ready_to_vote', {
    p_session: sessionId,
  });
  if (error) throw error;
}

export async function rpcSubmitVote(sessionId: string, votedFor: string) {
  const { error } = await requireSupabase().rpc('submit_vote', {
    p_session: sessionId,
    p_voted_for: votedFor,
  });
  if (error) throw error;
}

export async function rpcLeaveSession(sessionId: string) {
  const { error } = await requireSupabase().rpc('leave_session', { p_session: sessionId });
  if (error) throw error;
}

export async function fetchDebateSession(
  sessionId: string,
): Promise<OnlineDebateSessionRow | null> {
  const { data, error } = await requireSupabase()
    .from('game_sessions')
    .select('*')
    .eq('id', sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const row = data as Record<string, unknown>;
  return {
    id: String(row.id),
    group_id: row.group_id ? String(row.group_id) : null,
    host_id: String(row.host_id),
    topic_id: String(row.topic_id),
    status: row.status as OnlineDebateSessionRow['status'],
    phase: row.phase as OnlineDebateSessionRow['phase'],
    phase_ends_at: row.phase_ends_at ? String(row.phase_ends_at) : null,
    config: (row.config as Record<string, unknown>) ?? {},
    room_code: row.room_code ? String(row.room_code) : null,
    ready_to_vote: Array.isArray(row.ready_to_vote) ? (row.ready_to_vote as string[]) : [],
  };
}

export async function fetchSessionPlayers(sessionId: string): Promise<OnlineSessionPlayerRow[]> {
  const { data, error } = await requireSupabase()
    .from('session_players')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return (data ?? []) as OnlineSessionPlayerRow[];
}

export async function fetchDebateResults(sessionId: string): Promise<DebateResultsRow | null> {
  const { data, error } = await requireSupabase()
    .from('debate_results')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data as DebateResultsRow;
}

export async function fetchDebateTopicText(topicId: string): Promise<string | null> {
  const { data, error } = await requireSupabase()
    .from('debate_topics')
    .select('text')
    .eq('id', topicId)
    .maybeSingle();
  if (error) throw error;
  return data?.text ?? null;
}
