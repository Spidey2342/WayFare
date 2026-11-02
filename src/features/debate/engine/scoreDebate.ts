import type { DebatePlayerV2, VerdictSide } from './types';

export type DebateScoreLine = {
  playerId: string;
  participation: number;
  sideBonus: number;
  mvp: number;
  total: number;
};

/** Winning side +3, MVP +2, participation +1 (judge +1). Draw: +2 per debater side bonus. */
export function scoreDebate(
  players: DebatePlayerV2[],
  winningSide: VerdictSide,
  mvpUserId: string | null,
): Record<string, DebateScoreLine> {
  const lines: Record<string, DebateScoreLine> = {};
  for (const player of players) {
    if (player.role === 'spectator') continue;
    if (player.role === 'judge') {
      lines[player.id] = {
        playerId: player.id,
        participation: 1,
        sideBonus: 0,
        mvp: 0,
        total: 1,
      };
      continue;
    }
    const participation = 1;
    let sideBonus = 0;
    if (winningSide === 'draw') {
      sideBonus = 2;
    } else if (player.side === winningSide) {
      sideBonus = 3;
    }
    const mvp = mvpUserId === player.id ? 2 : 0;
    lines[player.id] = {
      playerId: player.id,
      participation,
      sideBonus,
      mvp,
      total: participation + sideBonus + mvp,
    };
  }
  return lines;
}

export function mvpMustBeDebater(players: DebatePlayerV2[], mvpUserId: string | null): boolean {
  if (mvpUserId === null) return true;
  const mvp = players.find((p) => p.id === mvpUserId);
  return mvp?.role === 'debater';
}
