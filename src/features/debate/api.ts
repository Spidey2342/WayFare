import { parseSessionSnapshot, type DebateSessionSnapshot } from '@/features/debate/sessionState';
import { requireSupabase } from '@/services/supabase';

import type { DebatePhase, DebateSide } from './types';

export type { DebateSessionSnapshot };

export type OnlineDebateSessionRow = {
  id: string;
  group_id: string | null;
  host_id: string;
  judge_id: string | null;
  topic_id: string | null;
  status: 'active' | 'finished' | 'cancelled';
  phase: DebatePhase;
  phase_ends_at: string | null;
  config: Record<string, unknown>;
  room_code: string | null;
  soft_timer_minutes: number | null;
  debate_started_at: string | null;
  verdict_announced_at: string | null;
  paused_at: string | null;
  total_paused_seconds: number;
  ready_to_vote: string[];
};

export type OnlineSessionPlayerRow = {
  session_id: string;
  user_id: string;
  display_name: string;
  avatar_key: string | null;
  side: DebateSide | null;
  role: 'judge' | 'debater' | 'spectator';
  is_ready: boolean;
  ready_to_vote: boolean;
  last_seen_at: string;
};

export type DebateResultsRow = {
  session_id: string;
  winning_side: string | null;
  tie: boolean;
  side_totals: { agree?: number; disagree?: number; for?: number; against?: number };
  player_totals: Record<string, number>;
  mvp_ids: string[];
};

export type DebateVerdictRow = {
  session_id: string;
  winning_side: 'agree' | 'disagree' | 'draw';
  mvp_user_id: string | null;
  decided_by: string;
  decided_at: string;
  changed_at: string | null;
};

function mapSide(raw: string | null): DebateSide | null {
  if (raw === 'agree' || raw === 'for') return 'agree';
  if (raw === 'disagree' || raw === 'against') return 'disagree';
  return null;
}

function mapPhase(raw: string): DebatePhase {
  if (raw === 'side_reveal' || raw === 'prep') return 'picking';
  if (raw === 'debate') return 'debating';
  if (raw === 'voting') return 'verdict';
  return raw as DebatePhase;
}

export async function rpcServerNow(): Promise<string> {
  const { data, error } = await requireSupabase().rpc('server_now');
  if (error) throw error;
  return data as string;
}

export async function rpcCreateDebateSession(
  groupId: string | null,
  topicId: string | null = null,
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

export async function rpcDebateTouchSession(sessionId: string) {
  const { data, error } = await requireSupabase().rpc('debate_touch_session', {
    p_session: sessionId,
  });
  if (error) throw error;
  return data as string | null;
}

export async function rpcDrawTopic(sessionId: string, expectedPhase?: string) {
  const { data, error } = await requireSupabase().rpc('draw_topic', {
    p_session: sessionId,
    p_expected_phase: expectedPhase ?? null,
  });
  if (error) throw error;
  return data as string;
}

export async function rpcShuffleTopic(sessionId: string, expectedPhase = 'topic') {
  const { data, error } = await requireSupabase().rpc('shuffle_topic', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
  return data as string;
}

export async function rpcGetSessionState(sessionId: string): Promise<DebateSessionSnapshot | null> {
  const { data, error } = await requireSupabase().rpc('get_session_state', {
    p_session: sessionId,
  });
  if (error) throw error;
  return parseSessionSnapshot(data);
}

export async function rpcConfirmTopic(sessionId: string, expectedPhase = 'topic') {
  const { error } = await requireSupabase().rpc('confirm_topic', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcChooseSide(
  sessionId: string,
  side: DebateSide,
  expectedPhase = 'picking',
) {
  const { error } = await requireSupabase().rpc('choose_side', {
    p_session: sessionId,
    p_side: side,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcMovePlayer(
  sessionId: string,
  userId: string,
  side: DebateSide,
  expectedPhase = 'picking',
) {
  const { error } = await requireSupabase().rpc('move_player', {
    p_session: sessionId,
    p_user: userId,
    p_side: side,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcSetSoftTimer(
  sessionId: string,
  minutes: number | null,
  expectedPhase = 'debating',
) {
  const { error } = await requireSupabase().rpc('set_soft_timer', {
    p_session: sessionId,
    p_minutes: minutes,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcStartDebate(sessionId: string, expectedPhase = 'picking') {
  const { error } = await requireSupabase().rpc('start_debate', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcRequestVerdict(sessionId: string, expectedPhase = 'debating') {
  const { error } = await requireSupabase().rpc('request_verdict', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcPauseDebate(sessionId: string, expectedPhase = 'debating') {
  const { error } = await requireSupabase().rpc('pause_debate', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcResumeDebate(sessionId: string, expectedPhase = 'debating') {
  const { error } = await requireSupabase().rpc('resume_debate', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcCancelVerdict(sessionId: string, expectedPhase = 'verdict') {
  const { error } = await requireSupabase().rpc('cancel_verdict', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcChangeVerdict(
  sessionId: string,
  winningSide: 'agree' | 'disagree' | 'draw',
  mvpUserId: string | null,
  expectedPhase = 'results',
) {
  const { error } = await requireSupabase().rpc('change_verdict', {
    p_session: sessionId,
    p_winning_side: winningSide,
    p_mvp_user_id: mvpUserId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcSubmitVerdict(
  sessionId: string,
  winningSide: 'agree' | 'disagree' | 'draw',
  mvpUserId: string | null,
  expectedPhase = 'verdict',
) {
  const { error } = await requireSupabase().rpc('submit_verdict', {
    p_session: sessionId,
    p_winning_side: winningSide,
    p_mvp_user_id: mvpUserId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

/** Thin wrapper — announces to RESULTS without awarding XP (spec). */
export async function rpcPublishVerdict(
  sessionId: string,
  winningSide: 'agree' | 'disagree' | 'draw',
  mvpUserId: string | null,
  expectedPhase = 'verdict',
) {
  const { error } = await requireSupabase().rpc('publish_verdict', {
    p_session: sessionId,
    p_winning_side: winningSide,
    p_mvp_user_id: mvpUserId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcNextRound(sessionId: string, expectedPhase = 'results') {
  const { error } = await requireSupabase().rpc('next_round', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcEndSession(sessionId: string, expectedPhase = 'results') {
  const { error } = await requireSupabase().rpc('end_session', {
    p_session: sessionId,
    p_expected_phase: expectedPhase,
  });
  if (error) throw error;
}

export async function rpcLeaveSession(sessionId: string) {
  const { error } = await requireSupabase().rpc('leave_session', { p_session: sessionId });
  if (error) throw error;
}

export async function rpcAwardSoloDebate(clientId: string) {
  const { data, error } = await requireSupabase().rpc('award_solo_debate', {
    p_client_id: clientId,
  });
  if (error) throw error;
  return data as Record<string, unknown>;
}

export async function rpcAwardPassDebate(clientId: string, xp: number) {
  const { data, error } = await requireSupabase().rpc('award_pass_debate', {
    p_client_id: clientId,
    p_xp: xp,
  });
  if (error) throw error;
  return data as Record<string, unknown>;
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
    judge_id: row.judge_id ? String(row.judge_id) : null,
    topic_id: row.topic_id ? String(row.topic_id) : null,
    status: row.status as OnlineDebateSessionRow['status'],
    phase: mapPhase(String(row.phase)),
    phase_ends_at: row.phase_ends_at ? String(row.phase_ends_at) : null,
    config: (row.config as Record<string, unknown>) ?? {},
    room_code: row.room_code ? String(row.room_code) : null,
    soft_timer_minutes:
      row.soft_timer_minutes === null || row.soft_timer_minutes === undefined
        ? null
        : Number(row.soft_timer_minutes),
    debate_started_at: row.debate_started_at ? String(row.debate_started_at) : null,
    verdict_announced_at: row.verdict_announced_at ? String(row.verdict_announced_at) : null,
    paused_at: row.paused_at ? String(row.paused_at) : null,
    total_paused_seconds: Number(row.total_paused_seconds ?? 0),
    ready_to_vote: Array.isArray(row.ready_to_vote) ? (row.ready_to_vote as string[]) : [],
  };
}

export async function fetchSessionPlayers(sessionId: string): Promise<OnlineSessionPlayerRow[]> {
  const { data, error } = await requireSupabase()
    .from('session_players')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      session_id: String(r.session_id),
      user_id: String(r.user_id),
      display_name: String(r.display_name),
      avatar_key: r.avatar_key ? String(r.avatar_key) : null,
      side: mapSide(r.side ? String(r.side) : null),
      role: (r.role as OnlineSessionPlayerRow['role']) ?? 'debater',
      is_ready: Boolean(r.is_ready),
      ready_to_vote: Boolean(r.ready_to_vote),
      last_seen_at: String(r.last_seen_at),
    };
  });
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

export async function fetchDebateVerdict(sessionId: string): Promise<DebateVerdictRow | null> {
  const { data, error } = await requireSupabase()
    .from('debate_verdicts')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return data as DebateVerdictRow;
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
