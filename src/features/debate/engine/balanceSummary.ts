import type { DebatePlayerV2 } from './types';

export type SideBalance = {
  agree: DebatePlayerV2[];
  disagree: DebatePlayerV2[];
  judge: DebatePlayerV2 | null;
  spectators: DebatePlayerV2[];
};

export function balanceSummary(players: DebatePlayerV2[]): SideBalance {
  const debaters = players.filter((p) => p.role === 'debater');
  return {
    agree: debaters.filter((p) => p.side === 'agree'),
    disagree: debaters.filter((p) => p.side === 'disagree'),
    judge: players.find((p) => p.role === 'judge') ?? null,
    spectators: players.filter((p) => p.role === 'spectator'),
  };
}
