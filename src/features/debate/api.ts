import { requireSupabase } from '@/services/supabase';

export type OnlineDebateRow = {
  id: string;
  group_id: string;
  host_id: string;
  deck_id: string;
  status: 'active' | 'complete';
  round_index: number;
  card_ids: string[];
};

export type OnlineDebatePlayerRow = {
  session_id: string;
  user_id: string;
  vote: 'agree' | 'disagree' | null;
  ready: boolean;
};

export async function rpcStartGroupDebate(groupId: string, deckId: string, cardIds: string[]) {
  const { data, error } = await requireSupabase().rpc('start_group_debate', {
    group_id: groupId,
    deck_id: deckId,
    card_ids: cardIds,
  });
  if (error) throw error;
  return data as string;
}

export async function rpcCastDebateVote(sessionId: string, vote: 'agree' | 'disagree') {
  const { error } = await requireSupabase().rpc('cast_debate_vote', {
    session_id: sessionId,
    vote,
  });
  if (error) throw error;
}

export async function rpcAdvanceDebateRound(sessionId: string) {
  const { data, error } = await requireSupabase().rpc('advance_debate_round', {
    session_id: sessionId,
  });
  if (error) throw error;
  return data as number;
}

export async function fetchDebateSession(sessionId: string): Promise<OnlineDebateRow | null> {
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
    group_id: String(row.group_id),
    host_id: String(row.host_id),
    deck_id: String(row.deck_id),
    status: row.status === 'complete' ? 'complete' : 'active',
    round_index: Number(row.round_index ?? 0),
    card_ids: Array.isArray(row.card_ids) ? (row.card_ids as string[]) : [],
  };
}

export async function fetchDebatePlayers(sessionId: string): Promise<OnlineDebatePlayerRow[]> {
  const { data, error } = await requireSupabase()
    .from('game_session_players')
    .select('*')
    .eq('session_id', sessionId);
  if (error) throw error;
  return (data ?? []) as OnlineDebatePlayerRow[];
}
