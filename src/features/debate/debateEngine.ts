export type DebateVote = 'agree' | 'disagree';

export interface DebateRound {
  cardId: string;
  prompt: string;
  votes: Record<string, DebateVote | null>;
}

export interface DebateSession {
  id: string;
  rounds: DebateRound[];
  roundIndex: number;
  status: 'active' | 'complete';
}

export function createDebateSession(
  id: string,
  statements: { cardId: string; prompt: string }[],
  playerIds: string[],
): DebateSession {
  if (statements.length === 0) throw new Error('Debate needs at least one statement.');
  if (playerIds.length === 0) throw new Error('Debate needs at least one player.');
  const votes = Object.fromEntries(playerIds.map((playerId) => [playerId, null]));
  return {
    id,
    roundIndex: 0,
    status: 'active',
    rounds: statements.map((statement) => ({
      cardId: statement.cardId,
      prompt: statement.prompt,
      votes: { ...votes },
    })),
  };
}

export function currentDebateRound(session: DebateSession): DebateRound | null {
  if (session.status !== 'active') return null;
  return session.rounds[session.roundIndex] ?? null;
}

export function castDebateVote(
  session: DebateSession,
  playerId: string,
  vote: DebateVote,
): DebateSession {
  const round = currentDebateRound(session);
  if (!round) return session;
  if (!(playerId in round.votes)) return session;
  const rounds = session.rounds.map((item, index) =>
    index === session.roundIndex ? { ...item, votes: { ...item.votes, [playerId]: vote } } : item,
  );
  return { ...session, rounds };
}

export function tallyVotes(round: DebateRound): {
  agree: number;
  disagree: number;
  pending: number;
} {
  let agree = 0;
  let disagree = 0;
  let pending = 0;
  for (const vote of Object.values(round.votes)) {
    if (vote === 'agree') agree += 1;
    else if (vote === 'disagree') disagree += 1;
    else pending += 1;
  }
  return { agree, disagree, pending };
}

export function allVotesIn(round: DebateRound): boolean {
  return tallyVotes(round).pending === 0;
}

export function advanceDebateRound(session: DebateSession): DebateSession {
  if (session.status !== 'active') return session;
  const nextIndex = session.roundIndex + 1;
  if (nextIndex >= session.rounds.length) {
    return { ...session, status: 'complete' };
  }
  return { ...session, roundIndex: nextIndex };
}

export function debateScoreTotals(session: DebateSession): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const round of session.rounds) {
    for (const [playerId, vote] of Object.entries(round.votes)) {
      totals[playerId] = (totals[playerId] ?? 0) + (vote ? 1 : 0);
    }
  }
  return totals;
}
