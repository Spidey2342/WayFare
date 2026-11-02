import { playerVoteTotals, sideVoteTotals } from './tallyVotes';
import type { DebatePlayer, DebateResults, DebateSide, DebateVoteMap } from './types';

export function computeResults(players: DebatePlayer[], votes: DebateVoteMap): DebateResults {
  const playerTotals = playerVoteTotals(players, votes);
  const sideTotals = sideVoteTotals(players, playerTotals);

  const winningSides: DebateSide[] = [];
  if (sideTotals.for > sideTotals.against) winningSides.push('for');
  else if (sideTotals.against > sideTotals.for) winningSides.push('against');
  else {
    winningSides.push('for', 'against');
  }
  const sideTie = sideTotals.for === sideTotals.against;

  let maxVotes = 0;
  for (const total of Object.values(playerTotals)) {
    if (total > maxVotes) maxVotes = total;
  }
  const mvpIds =
    maxVotes === 0
      ? []
      : players.filter((player) => (playerTotals[player.id] ?? 0) === maxVotes).map((p) => p.id);
  const mvpTie = mvpIds.length > 1;

  return {
    winningSides,
    sideTie,
    sideTotals,
    playerTotals,
    mvpIds,
    mvpTie,
  };
}
