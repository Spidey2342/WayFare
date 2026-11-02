import type { DebatePlayer, DebateVoteMap, SideTotals } from './types';

export function validateVote(voterId: string, votedFor: string, playerIds: string[]): void {
  if (!playerIds.includes(voterId)) throw new Error('Unknown voter.');
  if (!playerIds.includes(votedFor)) throw new Error('Unknown candidate.');
  if (voterId === votedFor) throw new Error('You cannot vote for yourself.');
}

export function playerVoteTotals(
  players: DebatePlayer[],
  votes: DebateVoteMap,
): Record<string, number> {
  const totals: Record<string, number> = Object.fromEntries(
    players.map((player) => [player.id, 0]),
  );
  for (const [voterId, votedFor] of Object.entries(votes)) {
    if (!votedFor || voterId === votedFor) continue;
    if (totals[votedFor] !== undefined) totals[votedFor] += 1;
  }
  return totals;
}

export function sideVoteTotals(
  players: DebatePlayer[],
  playerTotals: Record<string, number>,
): SideTotals {
  let forTotal = 0;
  let againstTotal = 0;
  for (const player of players) {
    const count = playerTotals[player.id] ?? 0;
    if (player.side === 'for') forTotal += count;
    else if (player.side === 'against') againstTotal += count;
  }
  return { for: forTotal, against: againstTotal };
}

export function allVotesSubmitted(players: DebatePlayer[], votes: DebateVoteMap): boolean {
  return players.every((player) => {
    const choice = votes[player.id];
    return typeof choice === 'string' && choice.length > 0 && choice !== player.id;
  });
}

export function countSubmittedVotes(players: DebatePlayer[], votes: DebateVoteMap): number {
  return players.filter((player) => {
    const choice = votes[player.id];
    return typeof choice === 'string' && choice.length > 0 && choice !== player.id;
  }).length;
}
