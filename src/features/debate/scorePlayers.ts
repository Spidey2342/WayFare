import type { DebatePlayer, DebateResults, PlayerScoreLine } from './types';

/** Winning side +3, MVP +2, participation +1 (stacking allowed). */
export function scorePlayers(
  players: DebatePlayer[],
  results: DebateResults,
): Record<string, PlayerScoreLine> {
  const lines: Record<string, PlayerScoreLine> = {};
  for (const player of players) {
    const participation = 1;
    const sideWin = player.side && results.winningSides.includes(player.side) ? 3 : 0;
    const mvp = results.mvpIds.includes(player.id) ? 2 : 0;
    lines[player.id] = {
      playerId: player.id,
      participation,
      sideWin,
      mvp,
      total: participation + sideWin + mvp,
    };
  }
  return lines;
}

export function totalXpFromScores(scores: Record<string, PlayerScoreLine>): number {
  return Object.values(scores).reduce((sum, line) => sum + line.total, 0);
}
