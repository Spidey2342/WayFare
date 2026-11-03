import type { DebatePhase, DebateSide } from '@/features/debate/types';

export type DebatePresence = 'online' | 'away';

export type SessionStateParticipant = {
  user_id: string;
  display_name: string;
  avatar_key: string | null;
  role: 'judge' | 'debater' | 'spectator';
  side: DebateSide | null;
  presence: DebatePresence;
  last_seen_at: string;
  connected_at: string;
  left_at: string | null;
};

export type DebateSessionSnapshot = {
  session: {
    id: string;
    group_id: string | null;
    status: 'active' | 'finished' | 'cancelled';
    phase: DebatePhase | 'finished';
    round_no: number;
    state_version: number;
    topic_id: string | null;
    judge_id: string | null;
    soft_timer_minutes: number | null;
    debate_started_at: string | null;
    paused_at: string | null;
    total_paused_seconds: number;
    verdict_announced_at: string | null;
    room_code: string | null;
    xp_awarded: boolean;
  };
  topic: { id: string; text: string; category: string; difficulty: string } | null;
  round_no: number;
  phase: DebatePhase | 'finished';
  judge_id: string | null;
  participants: SessionStateParticipant[];
  soft_timer_minutes: number | null;
  pause: { paused_at: string | null; total_paused_seconds: number };
  verdict: {
    winning_side: 'agree' | 'disagree' | 'draw';
    mvp_user_id: string | null;
    decided_by: string;
    decided_at: string;
    changed_at: string | null;
    verdict_announced_at: string | null;
    xp_awarded_at: string | null;
    points: Record<string, number> | null;
    round_no: number;
  } | null;
  results: {
    winning_side: string | null;
    tie: boolean;
    side_totals: { agree?: number; disagree?: number };
    player_totals: Record<string, number>;
    mvp_ids: string[];
    round_no: number;
  } | null;
  server_now: string;
};

function mapPhase(raw: string): DebatePhase | 'finished' {
  if (raw === 'finished') return 'finished';
  if (raw === 'side_reveal' || raw === 'prep') return 'picking';
  if (raw === 'debate') return 'debating';
  if (raw === 'voting') return 'verdict';
  return raw as DebatePhase;
}

export function parseSessionSnapshot(raw: unknown): DebateSessionSnapshot | null {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;
  const sessionRaw = record.session as Record<string, unknown> | undefined;
  if (!sessionRaw) return null;
  const serverNow =
    typeof record.server_now === 'string'
      ? record.server_now.replace(/^"|"$/g, '')
      : new Date().toISOString();

  return {
    session: {
      id: String(sessionRaw.id),
      group_id: sessionRaw.group_id ? String(sessionRaw.group_id) : null,
      status: sessionRaw.status as DebateSessionSnapshot['session']['status'],
      phase: mapPhase(String(sessionRaw.phase)),
      round_no: Number(sessionRaw.round_no ?? 1),
      state_version: Number(sessionRaw.state_version ?? 0),
      topic_id: sessionRaw.topic_id ? String(sessionRaw.topic_id) : null,
      judge_id: sessionRaw.judge_id ? String(sessionRaw.judge_id) : null,
      soft_timer_minutes:
        sessionRaw.soft_timer_minutes === null || sessionRaw.soft_timer_minutes === undefined
          ? null
          : Number(sessionRaw.soft_timer_minutes),
      debate_started_at: sessionRaw.debate_started_at ? String(sessionRaw.debate_started_at) : null,
      paused_at: sessionRaw.paused_at ? String(sessionRaw.paused_at) : null,
      total_paused_seconds: Number(sessionRaw.total_paused_seconds ?? 0),
      verdict_announced_at: sessionRaw.verdict_announced_at
        ? String(sessionRaw.verdict_announced_at)
        : null,
      room_code: sessionRaw.room_code ? String(sessionRaw.room_code) : null,
      xp_awarded: sessionRaw.xp_awarded === true,
    },
    topic: record.topic as DebateSessionSnapshot['topic'],
    round_no: Number(record.round_no ?? sessionRaw.round_no ?? 1),
    phase: mapPhase(String(record.phase ?? sessionRaw.phase)),
    judge_id: record.judge_id ? String(record.judge_id) : null,
    participants: (record.participants as SessionStateParticipant[]) ?? [],
    soft_timer_minutes:
      record.soft_timer_minutes === null || record.soft_timer_minutes === undefined
        ? null
        : Number(record.soft_timer_minutes),
    pause: (record.pause as DebateSessionSnapshot['pause']) ?? {
      paused_at: null,
      total_paused_seconds: 0,
    },
    verdict: (record.verdict as DebateSessionSnapshot['verdict']) ?? null,
    results: (record.results as DebateSessionSnapshot['results']) ?? null,
    server_now: serverNow,
  };
}
